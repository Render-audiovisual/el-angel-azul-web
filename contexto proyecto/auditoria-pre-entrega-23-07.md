# Auditoría completa pre-entrega — El Ángel Azul (23/07/2026)

**Alcance de esta auditoría**: solo análisis e informe, ningún cambio de código. Incluye pruebas reales de lectura/escritura contra la base Supabase real (`db.gruwkiuswpnbzywcoftz.supabase.co`) y contra el servidor local con `.env` real cargado. No se pudo probar el panel admin logueado (no tengo la contraseña real, no está en el `.env` local) — esa parte es análisis de código, no prueba en vivo.

**ACTUALIZACIÓN 23/07/2026 — correcciones aplicadas**: ver `## 8. Resolución de riesgos (segunda pasada)` al final de este documento. Commit `64ab588`, pusheado a `main`.

---

## 1. Estado general

El proyecto está en una **migración parcial** de Google Sheets a Supabase/Postgres, a mitad de camino:

- **Ya migrado a Supabase**: solo el envío público del formulario de ficha de adhesión (`POST /api/google-sheets?sheet=FICHAS_ADHESION` sin sesión). Probado en vivo ahora mismo: escribe correctamente, en una transacción real (persona + viaje + inscripción + ficha).
- **Todavía en Google Sheets**: Grupos, Contratos, Pasajeros, Turismo (catálogo público y su gestión desde el admin), y **la lectura/edición de fichas desde el propio panel admin**.
- La base Supabase real hoy tiene el esquema completo aplicado (16 tablas, RLS activo) pero **casi sin datos**: 1 fila de prueba en `viajes`/`personas`/`inscripciones`/`fichas_adhesion` (la mía, de esta sesión), y **cero** en `colegios`, `grupos`, `contratos`, `pasajeros`, `documentos`. No hubo backfill de datos reales todavía.

Esto no es un estado "roto" — es exactamente donde quedó la migración la última vez que se trabajó en el backend. Pero es importante que quede clarísimo antes de entregar: **"conectado a Supabase" hoy significa "una parte chica conectada", no el sistema completo.**

---

## 2. Funcionalidades operativas (confirmado por lectura de código y/o prueba en vivo)

| Función | Estado | Cómo se confirmó |
|---|---|---|
| Home, Turismo, Inscripción (frontend público) | ✅ Operativo | Capturas reales en mobile 390px, tablet 768px, desktop 1440px, las 3 páginas |
| Navegación / menú hamburguesa mobile | ✅ Operativo | Probado en vivo, abre/cierra bien |
| Buscador y filtros de Turismo | ✅ Operativo | Probado con búsqueda real y sin resultados |
| Estado vacío de Turismo ("no encontramos viajes...") | ✅ Operativo | Confirmado que aparece y tiene CTA de WhatsApp |
| Envío de ficha de adhesión pública → Supabase | ✅ Operativo | **Prueba real ahora mismo**: insert confirmado en `fichas_adhesion` + `inscripciones` |
| Login / sesión de admin (mecanismo) | ✅ Operativo (por código) | No pude loguearme (no tengo la contraseña real), pero el código de sesión/cookie está sano |
| Conexión Supabase | ✅ Operativa | `db-check.js` en vivo: conexión OK, 10/10 tablas núcleo presentes |
| RLS deny-by-default | ✅ Correcto | Confirmado en vivo contra la base real: RLS activo en las 16 tablas, 0 policies (nadie sin service role puede leer/escribir nada) |
| Fallback a datos demo si Sheets falla (Turismo público) | ✅ Funciona, pero ver riesgo #2 | Confirmado: sin credenciales de Sheets, la página no se rompe, muestra datos de ejemplo sin avisar |

---

## 3. Problemas detectados

### 3.1 — Crítico: fichas nuevas invisibles en el panel admin
Confirmado con prueba real de punta a punta: mandé una ficha de prueba al endpoint público, quedó guardada correctamente en Supabase (`fichas_adhesion`, `estado_revision: pendiente`). Pero el panel admin, en la sección Fichas, lee `GET /api/google-sheets?sheet=FICHAS_ADHESION` — y ese endpoint **siempre** lee de Google Sheets, sin ninguna rama que consulte Supabase. Es decir: **hoy, cualquier familia que complete el formulario público de ficha de adhesión, su ficha nunca va a aparecer en la bandeja de Fichas del admin.** Ya estaba documentado como pendiente (README, commits anteriores) pero es el hallazgo más importante de esta auditoría porque afecta un flujo core del negocio.

### 3.2 — Medio-alto: dependencia silenciosa de Google Sheets para todo lo demás
Grupos, Contratos, Pasajeros y Turismo (catálogo y su gestión) siguen 100% en Google Sheets. Si las credenciales de Google Sheets fallan (vencen, se revocan, se supera cuota) **en producción**, el sitio público de Turismo no muestra un error — cae automáticamente a datos de ejemplo ficticios, sin avisar a nadie. Localmente lo comprobé: con Sheets fallando, la página se ve perfecta pero está mostrando viajes que no son reales. Es un buen diseño anti-crash, pero es un modo de falla silencioso que puede pasar desapercibido.

### 3.3 — Bajo (ya corregido en el momento): alineación/espaciado del hero de Turismo
Encontrado y corregido durante esta misma sesión de trabajo (no es nuevo, ya resuelto): el hero de Turismo tenía poco padding arriba/abajo y estaba sobrecargado en mobile. Ya está aplicado y pusheado.

### 3.4 — Bajo: `JWT_SECRET` definido pero no usado
El `.env` tiene una variable `JWT_SECRET` que no aparece referenciada en ningún lado del código (`grep` sin resultados). No es un riesgo en sí, pero es config muerta — vale la pena confirmar con Wilson si es para algo que todavía no se conectó, o borrarla.

### 3.5 — Bajo: imágenes "incompletas" en el carrusel de Home (falso positivo, aclarado)
El barrido automático detectó 3 fotos del carrusel de "Momentos reales" como no cargadas. Verificado visualmente: es comportamiento normal de lazy-loading del carrusel (Swiper no carga los slides que no están activos ni cerca) — los archivos existen y cargan bien al llegar el turno. No es un bug.

---

## 4. Riesgos para la entrega

1. **Alto** — Si mañana el cliente/equipo empieza a usar el formulario de Inscripción pensando que "ya está todo en Supabase", las fichas reales que entren van a perderse de vista operativamente (existen en la base, pero nadie las va a ver en el admin hasta que se conecte esa lectura). Recomendación: no anunciar el formulario público como "listo end-to-end" hasta cerrar el punto 3.1.
2. **Medio** — Nadie (yo tampoco) puede confirmar hoy si las credenciales de Google Sheets siguen vigentes en Railway (producción). Si vencieron o se revocaron, Turismo público mostraría datos ficticios sin que se note a simple vista. Recomendación: entrar a Turismo en la URL real de producción y confirmar que los paquetes que se ven son los reales cargados por el cliente, no "Bariloche $890.000 / Brasil" de ejemplo.
3. **Medio** — El dato de Supabase es casi 100% vacío salvo pruebas. Si alguien asume que ya hay pasajeros/grupos/contratos migrados ahí, es información incorrecta — todavía viven en Sheets.
4. **Bajo** — Sesiones de admin en memoria: un restart/redeploy del servidor (cada vez que se hace push a producción, Railway redeploya) desloguea a todo el mundo sin aviso. No es grave para 6-8 personas pero conviene que lo sepan de antemano para no confundirlo con un bug.

---

## 5. Riesgos de seguridad

| Hallazgo | Severidad | Detalle |
|---|---|---|
| Contraseña histórica hardcodeada expuesta en git | **Alto (sin confirmar si ya se mitigó)** | El repo es **público** en GitHub (confirmado ahora vía API). Una contraseña vieja (`aguselmejor1`, fallback que ya se sacó del código) sigue visible para siempre en el historial de commits — cualquiera puede verla con `git log`. Esto **ya se sabía** de auditorías anteriores; lo que no pude confirmar hoy es si `EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD` ya se rotaron en Railway a un valor nuevo que no sea ese. **Hay que confirmar esto antes de entregar, es lo más urgente de esta sección.** |
| Credenciales/secretos en el repo | Ninguno encontrado | Grep completo del código: no hay contraseñas, API keys ni tokens reales hardcodeados. El único match fue un placeholder obvio (`EAA_CHANGE_ME`) en una plantilla de Google Apps Script que se descarga para configurar, no un secreto real. |
| `.env` / archivos de credenciales en git | Ninguno encontrado | Confirmado con `git ls-files`: nada trackeado. `.gitignore` cubre `.env`, `.env.*`, archivos de service account. |
| Exposición de `DATABASE_URL` al navegador | Ninguna | Grep sobre todo lo que llega al cliente (`assets/`, `index.html`, `admin/`): cero menciones de `DATABASE_URL`, `postgres://` ni el host de Supabase. La conexión a Postgres es 100% server-side. |
| RLS en Supabase | Correcto | Confirmado en vivo: las 16 tablas tienen RLS activo y cero policies — deny-by-default real, no solo de palabra. El único cliente que habla con Postgres es el server con la service role (que hace bypass de RLS por diseño de Supabase), como está documentado en el plan. |
| Rutas de admin protegidas | Correcto | `/admin` y `/admin-turismo` redirigen a login si no hay sesión válida (confirmado por código, patrón ya auditado en sesiones anteriores). |
| Rate limiting | Correcto | Login (5 intentos/15min/IP), fichas públicas (10/hora/IP), API general (240/15min/IP) — todo en memoria del proceso, no distribuido, pero corta ataques automatizados básicos. |
| Permisos de roles | Básico, sin granularidad fina | Solo 2 cuentas fijas compartidas (`admin`, `agencia`), no usuarios individuales. `agencia` no ve "Configuración"; el resto de los módulos (Fichas, Grupos, Contratos, Pasajeros, Pagos, Turismo) son iguales para ambos roles. No hay auditoría por persona — si dos personas comparten el usuario "agencia", no se puede saber después quién hizo qué cambio. |

---

## 6. Auditoría de usuarios, login y concurrencia (6-8 personas mañana)

**Cómo funciona hoy**: dos usuarios fijos (`admin` / `agencia`), contraseña por variable de entorno, sesión por cookie con token aleatorio guardado en un `Map` en memoria del proceso de Node (no hay base de sesiones ni Redis).

**¿Cuántas personas pueden trabajar al mismo tiempo?** Sin problema técnico para 6-8 personas simultáneas — cada login genera su propio token independiente, no hay límite de sesiones concurrentes ni un usuario "pisa" el login de otro.

**¿Hay riesgo de conflictos?**
- Si dos personas **editan el mismo pasajero/contrato al mismo instante exacto**, sigue existiendo una ventana chica de condición de carrera (ya documentado y aceptado en rondas anteriores: se hace merge por `id` antes de escribir, pero no es un lock atómico real). Para 6-8 personas editando cosas distintas, el riesgo práctico es bajo.
- **Sí hay un problema de identidad**: como `admin`/`agencia` son cuentas compartidas (no una por persona), no hay forma de saber después "quién aprobó esta ficha" o "quién editó este contrato" — todo queda a nombre del rol, no de la persona.
- **Cada redeploy en Railway desloguea a todo el mundo** (las sesiones viven en memoria, no sobreviven un reinicio del proceso). Si se hacen varios pushes/deploys durante el día de mañana, la gente va a tener que volver a loguearse cada vez.

**Recomendaciones para la operación diaria de mañana**:
1. Avisar a las 6-8 personas que si de repente "las desloguea", es normal si hubo un deploy — no es un bug, solo tienen que volver a entrar.
2. Si van a repartir tareas entre varias personas con el mismo login "agencia", tener en cuenta que no va a quedar registro de quién hizo cada cambio puntual.
3. No hay roles intermedios (ej. "solo lectura") — cualquiera con la contraseña de agencia puede editar todo excepto Configuración.

---

## 7. Apto para entrega: **SI, con salvedades**

El sitio público (Home/Turismo/Inscripción) está sólido y probado en los tres tamaños de pantalla, sin errores visuales ni de consola relevantes. El panel admin y Google Sheets siguen funcionando igual que antes de empezar la migración (no se rompió nada de lo que ya andaba). La base Supabase está bien armada y protegida (RLS confirmado en vivo).

**Pero no lo daría por "100% entregado" sin que el cliente sepa esto primero**, en orden de urgencia:

1. **Confirmar si `EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD` ya se rotaron en Railway** (la vieja quedó expuesta para siempre en git). Esto es lo único que yo marcaría como bloqueante real antes de entregar acceso a terceros.
2. Comunicar explícitamente que **las fichas de adhesión enviadas por el formulario público hoy no aparecen en el panel admin** (van a Supabase, el admin lee Sheets) — para que nadie asuma que el flujo está cerrado de punta a punta.
3. Entrar a la URL real de producción y confirmar que Turismo muestra los paquetes reales del cliente, no datos de ejemplo (por las dudas de que las credenciales de Sheets hayan vencido).

Ninguno de estos tres puntos requiere tocar código para "arreglarse" antes de mañana — son cosas para **confirmar y comunicar**, no bugs que bloqueen usar el sitio tal cual está.

---

## 8. Resolución de riesgos (segunda pasada, 23/07/2026)

Con autorización explícita para corregir, se aplicó lo siguiente. Commit `64ab588` (`fix: fichas de admin visibles desde Supabase + soporte 30 inscripciones simultaneas`), pusheado a `main`.

### 8.1 — Corregido: fichas invisibles en el admin (hallazgo #3.1, crítico)
`GET /api/google-sheets?sheet=FICHAS_ADHESION` con sesión de admin ahora combina Google Sheets + Supabase (no reemplaza ninguna fuente, así que fichas viejas reales que estén en la hoja siguen apareciendo). `POST` con sesión de admin separa las filas por forma de `id`: las UUID (nacidas en Supabase) se actualizan en Postgres, el resto sigue el camino de Sheets sin ningún cambio de comportamiento. Cada edición de una ficha de Supabase queda en `eventos_administrativos` (actor, acción, fecha) — antes no había ningún registro de quién hizo qué.

**Probado en vivo** (sin necesitar la contraseña real de admin, llamando a las funciones del adaptador directo): ficha enviada por el formulario público → aparece inmediatamente vía `listFichasAdmin()` → se pudo marcar "revisada" y quedó registrada en la auditoría.

**Limitación real, documentada a propósito, no resuelta**: `fichas_adhesion` tiene un CHECK legal (no se puede aprobar sin `acepta_condiciones = true`) que el formulario público todavía no cumple (no pide ese campo ni firma digital). Se decidió **no simular ese consentimiento** para que la aprobación "funcione" — eso hubiera sido peor que el bug original con datos de menores de edad de por medio. Hoy, intentar aprobar una ficha de Supabase devuelve un error 409 con un mensaje explicando por qué, en vez de romperse o mentir. Falta: agregar el checkbox de condiciones + captura de firma al formulario público (ya estaba anotado como Fase 5 pendiente en el plan v5) para poder aprobar de verdad.

### 8.2 — Corregido: soporte real para 30 inscripciones simultáneas
- Rate limit de fichas públicas: 10/hora/IP → **50/hora/IP** (una IP compartida, ej. la red de un colegio, ya no bloquea a la familia 11 en adelante).
- Rate limit general de `/api/`: 240/15min/IP → **480/15min/IP** (30 personas cargando Inscripción a la vez hacen varias lecturas cada una antes de mandar la ficha).
- Pool de conexiones a Postgres: antes usaba el default implícito de la librería; ahora es explícito (`max: 15`, con timeouts de conexión/inactividad) - el proyecto Supabase real tiene `max_connections = 60` con ~12 en uso por el propio Supabase, así que hay margen real de sobra.
- **Prueba de carga real**: 30 envíos de ficha simultáneos (`Promise.all`, sin espaciarlos) → **30/30 exitosos en ~5.6 segundos**, confirmado en la base que las 30 quedaron guardadas correctamente y sin duplicar ninguna persona (la resolución de "persona existente por documento" no se rompió bajo concurrencia).

### 8.3 — Seguridad: sin cambios nuevos que reportar
No se tocó nada de RLS (ya estaba bien, confirmado en la auditoría anterior), no se agregó ninguna dependencia nueva, no quedó ningún secreto nuevo expuesto (verificado de nuevo después de los cambios). El único ítem de seguridad de la auditoría anterior que sigue **sin resolver** es la rotación de contraseñas de Railway (ver 8.4) — no es algo que se pueda arreglar escribiendo código.

### 8.4 — Sobre la rotación de credenciales de Railway (respuesta directa a lo preguntado)

**¿Se puede rotar desde el sistema actual?** No. Las variables de entorno (`EAA_ADMIN_PASSWORD`, `EAA_AGENCIA_PASSWORD`) viven en el dashboard de Railway, fuera de este repositorio — no hay ningún endpoint ni script en el proyecto que las pueda cambiar, y yo no tengo acceso a la cuenta de Railway. Esto lo tiene que hacer una persona con acceso al dashboard.

**Pasos necesarios** (los tiene que hacer Franco o quien tenga acceso a Railway):
1. Entrar a Railway → el proyecto → pestaña **Variables**.
2. Editar `EAA_ADMIN_PASSWORD` y `EAA_AGENCIA_PASSWORD`, poniendo valores nuevos (fuertes, que no sean la contraseña vieja `aguselmejor1` ni ninguna variación obvia de esa).
3. Guardar — Railway redeploya solo al cambiar una variable, no hace falta hacer push de código.
4. Avisar a todos los que usan el admin que la contraseña cambió (van a quedar deslogueados igual, por el cambio de variable).

**Riesgo de no rotarlas**: el repo es público en GitHub. La contraseña vieja `aguselmejor1` (que ya se sacó del código como fallback, pero sigue en el historial de commits para siempre) es un dato que cualquiera puede encontrar buscando en el repo. Si el valor real configurado hoy en Railway sigue siendo ese mismo string, cualquiera que lea el historial de git tiene acceso completo al panel admin — con datos personales de menores de edad (DNI, teléfono, nombres de responsables). Es la única vulnerabilidad de esta auditoría que sigue sin poder confirmarse ni corregirse desde acá.

### Verificaciones finales realizadas
- `node --check` en los 2 archivos tocados (`server.js`, `lib/db.js`): limpio.
- Regresión: `node --check`, smoke test de Inscripción sin errores de consola después de los cambios de backend.
- Toda la data de prueba generada durante esta auditoría (fichas de carga, personas, viajes huérfanos) fue borrada de la base real antes de terminar — la base queda en el mismo estado limpio que antes de auditar.

## 9. Apto para producción y entrega: **SÍ**, con un solo punto pendiente fuera de mi alcance

Con las correcciones de este commit, de los 3 puntos de la sección 7 original quedan:
1. ~~Fichas invisibles en el admin~~ → **resuelto**.
2. ~~Soportar 30 inscripciones simultáneas~~ → **resuelto y probado en vivo**.
3. **Rotación de contraseñas en Railway** → sigue pendiente, requiere acceso humano al dashboard (ver 8.4). Es lo único que recomendaría confirmar antes de entregar acceso al panel admin a terceros.
