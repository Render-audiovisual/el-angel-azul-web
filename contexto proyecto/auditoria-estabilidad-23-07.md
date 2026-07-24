# Auditoría de estabilidad, seguridad y mantenimiento — El Ángel Azul (23/07/2026)

**Alcance**: sin nuevas funcionalidades, sin cambios de arquitectura. Solo correcciones de bajo riesgo sobre seguridad, estabilidad y código muerto/frágil. Todo probado en vivo contra la base Supabase real antes de dar por cerrado cada punto.

---

## 1. Usuarios individuales en Supabase Auth (Prioridad 1) — bloqueado, necesito una decisión tuya

No pude hacer esto. No es una corrección de código — necesito una credencial que no tengo en este entorno: el **project URL + service_role API key de Supabase** (distinto del `DATABASE_URL` que ya tengo — ese es la conexión directa a Postgres, no da acceso a la API de Auth). Sin eso no puedo crear usuarios de Supabase Auth desde acá, ni por script ni por ninguna otra vía.

Tampoco lo intenté por un atajo (insertar directo en la tabla `auth.users` por SQL) — es una tabla interna de Supabase con lógica propia de hasheo de contraseña e identidades asociadas; escribirla a mano por fuera de la API real puede dejar cuentas rotas que nunca puedan loguearse. Con datos de menores de por medio, no es donde quiero improvisar.

**Dos caminos, elegí uno:**
1. **Recomendado — lo hacés vos mismo en 5 minutos, sin darme ninguna credencial nueva**: Supabase → tu proyecto → **Authentication → Users → Add user** → cargás el email y una contraseña para cada una de las 6 personas (Administrador General + 5 Agentes). Listo, quedan creadas. (Ojo: hoy esto NO conecta con el login del panel — ver la aclaración de la sección 4 de la conversación anterior. Es la preparación, no la conexión.)
2. Si preferís que yo lo automatice por script, hace falta que agregues `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` a tu `.env` local (nunca por chat). Te aviso desde ya: es la credencial más sensible del proyecto (bypassa todos los permisos), así que si no es estrictamente necesario automatizarlo, el camino 1 es más simple y no expone nada nuevo.

---

## 2. Seguridad — hallazgos y correcciones

### 2.1 — Corregido: el pool de Postgres podía tirar abajo todo el servidor
**El hallazgo más grave de esta pasada.** El pool de conexiones a Supabase no tenía manejador de errores. Es un problema conocido de la librería `pg`: si una conexión inactiva del pool pierde la red (un corte transitorio entre Railway y Supabase, algo que puede pasar cualquier día), Node trata ese error como no manejado y **cierra todo el proceso — no solo la parte de Supabase, el sitio entero deja de responder** hasta que Railway lo reinicie solo. Agregado el manejador: ahora ese error se loguea y el pool sigue funcionando.

### 2.2 — Corregido: endurecimiento del filtro de rutas de archivos
El chequeo que evita servir archivos fuera de la carpeta del proyecto (`filePath.startsWith(ROOT)`) tenía un caso borde teórico: si existiera una carpeta hermana cuyo nombre empezara igual que la del proyecto, ese chequeo la habría dejado pasar. Cerrado exigiendo el separador de carpeta después. No cambia ningún comportamiento para pedidos normales.

### 2.3 — Revisado, sin hallazgos nuevos
- RLS deny-by-default: sigue correcto (ya confirmado en la auditoría anterior, no se tocó nada de Supabase que lo afecte).
- No hay credenciales, tokens ni contraseñas nuevas expuestas en el código (repasado después de todos los cambios).
- Rutas protegidas (`/admin`, `/admin-turismo`), rate limiting, same-origin en escrituras: sin cambios, siguen como estaban.
- Pendiente de siempre, no depende de código: la rotación de `EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD` en Railway (contraseña vieja expuesta en el historial de git público).

---

## 3. Estabilidad — hallazgos y correcciones (con pruebas reales, no solo lectura de código)

### 3.1 — Corregido y confirmado con prueba de carga: viajes duplicados bajo concurrencia real
Este fue el hallazgo más significativo de toda la sesión, y lo encontré probando, no leyendo código. Al resolver "buscar o crear el viaje" en dos pasos separados (buscar, después insertar si no existe), una ráfaga real de familias distintas anotándose al **mismo** viaje al mismo tiempo — el caso normal para el sistema, no uno raro — podía generar varias filas duplicadas del mismo viaje en vez de reusar una. **Lo confirmé con una prueba real: 30 fichas simultáneas para "Bariloche 2026" generaron 15 filas duplicadas.**

Se agregó un índice único (`supabase/migrations/0002_viajes_unique_estudiantil.sql`) y la resolución pasó a ser una operación atómica.

**Encontré una regresión al aplicar el primer fix, y la corregí en el momento**: la primera versión de la corrección resolvía el viaje *dentro* de la misma transacción que crea la inscripción y la ficha — bajo la misma prueba de 30 simultáneos, eso serializó tanto la escritura (todas compitiendo por bloquear la misma fila durante toda una transacción más larga) que 6 de las 30 empezaron a fallar por agotamiento del pool de conexiones. Lo reestructuré para resolver el viaje en una operación corta e independiente, *antes* de abrir la transacción principal. Reprobado: **30/30 exitosas, un solo viaje creado, mismo tiempo de respuesta que antes (~5 segundos).**

### 3.2 — Corregido: la misma persona enviando dos veces podía fallar con un error crudo
Mismo tipo de problema que el de arriba, a menor escala: si la misma persona mandaba su ficha dos veces casi al mismo instante (doble clic, o un reintento automático del navegador tras un corte), la identidad ("persona") podía intentar crearse dos veces en paralelo y la segunda chocaba con un error de base de datos sin traducir. Corregido con el mismo patrón de operación atómica. Probado en vivo: dos envíos simultáneos de la misma persona → ambos exitosos, una sola persona creada, dos fichas (correcto).

### 3.3 — Corregido: una ficha con problema bloqueaba a las demás del mismo guardado
Cuando el admin aprueba/edita varias fichas en un solo guardado, antes se procesaban todas en una única transacción — si UNA fallaba (típicamente por el límite legal de "no aprobar sin consentimiento digital", ver más abajo), se revertían también los cambios de las demás fichas del mismo lote, aunque no tuvieran ningún problema. Ahora cada ficha se procesa de forma independiente. Probado en vivo: un lote con una ficha que debía fallar y otra que debía guardarse bien → la que debía fallar quedó reportada con un mensaje claro, la otra se guardó correctamente, sin perder nada.

### 3.4 — Corregido: fuga de memoria lenta en producción
Los contadores de rate limiting (intentos de login, envíos de ficha, límite general de API) y las sesiones de admin solo se limpiaban cuando esa misma IP volvía a pedir algo después de vencida su ventana. Una IP que visita el sitio público una sola vez queda para siempre en memoria. En un sitio con tráfico real sostenido durante varias semanas, esto crece indefinidamente. Agregado un barrido automático cada 15 minutos — no cambia ningún comportamiento visible, solo libera lo que ya venció.

### 3.5 — Ya eran correctos, confirmado (no tocado)
- Manejo de errores general del servidor (try/catch en el nivel más alto, capturado en todos los casos).
- Merge por id en las escrituras a Google Sheets (ya resuelto en una ronda anterior).
- Sanitización y límites de tamaño de campos en las escrituras.

---

## 4. Código que podía provocar problemas en producción

- **Error crudo de Postgres detectado por texto en vez de por campo estructurado**: el mensaje de error que distingue "no se puede aprobar sin consentimiento" se detectaba buscando la palabra "fichas_adhesion" dentro del texto del error — frágil (podía dejar de funcionar si Postgres cambia el formato del mensaje). Corregido para usar `error.table`, un campo estructurado que el driver ya entrega, mucho más confiable.
- **Config muerta, sin acción necesaria**: la variable `JWT_SECRET` sigue definida en `.env` pero no se usa en ningún lado del código (ya se había detectado en la auditoría anterior). No representa un riesgo, solo confirmar con Wilson si es para algo que no se llegó a conectar.
- No se encontró código duplicado nuevo ni lógica muerta relevante en los archivos tocados esta sesión (`server.js`, `lib/db.js`) — la limpieza de código muerto grande de `app.js` ya se había hecho en una sesión anterior (documentado en memoria del proyecto).

---

## 5. ¿El sistema está listo para operar con varios usuarios simultáneamente?

**Sí**, con más confianza que antes de esta auditoría. Antes de estas correcciones, la prueba de 30 simultáneos "pasaba" pero escondía un problema real (duplicación de viajes) que solo salió a la luz al revisar los datos después, no en la respuesta HTTP. Ahora:

- 30 inscripciones simultáneas para destinos distintos: sin problema (ya probado en la auditoría anterior).
- **30 inscripciones simultáneas para el MISMO destino** (el caso más exigente, y el más realista - un colegio entero anotándose al mismo viaje): probado ahora, 30/30 exitosas, sin duplicar nada, mismo tiempo de respuesta.
- Un corte de red transitorio con Supabase ya no puede tirar abajo el servidor completo.
- El panel admin sigue funcionando exactamente igual que antes para todo lo que ya andaba (Google Sheets sin tocar).

Lo único que sigue sin resolver, y no depende de código: la rotación de contraseñas en Railway, y la decisión sobre usuarios individuales de Supabase Auth (sección 1).
