# Auditoría completa pre-entrega — El Ángel Azul (23/07/2026)

**Alcance de esta auditoría**: solo análisis e informe, ningún cambio de código. Incluye pruebas reales de lectura/escritura contra la base Supabase real (`db.gruwkiuswpnbzywcoftz.supabase.co`) y contra el servidor local con `.env` real cargado. No se pudo probar el panel admin logueado (no tengo la contraseña real, no está en el `.env` local) — esa parte es análisis de código, no prueba en vivo.

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
