# Plan de migración a Hostinger y cierre del proyecto

Para Wilson — estado actual, qué falta, y en qué orden. Reemplaza cualquier
plan intermedio que se haya hablado antes por chat (hubo confusión sobre si
la primera etapa se hacía con Google Sheets todavía activo — **no**, se
descartó: no hay datos reales que preservar, así que vamos directo a
Postgres, sin fase intermedia con Sheets).

## Contexto (por qué estamos acá)

Railway (donde corría producción) se cayó — era plan gratis y venció. El
cliente ya tiene Hostinger pagado (plan Business, con la función "Web Apps"
para deploy de Node.js desde GitHub) y decidió mudarse ahí. Aprovechamos
el corte para saltar directo a Supabase/Postgres en vez de intentar
reconstruir el acceso a Google Sheets, que de todos modos se iba a
discontinuar.

**Decisión confirmada con el cliente**: no hay datos reales que preservar
en el Google Sheet viejo. Arrancamos con las tablas de Postgres vacías —
el equipo vuelve a cargar Grupos/Contratos/Pasajeros/Turismo desde el
admin nuevo. No hace falta backup ni carga inicial de datos históricos.

## Estado actual del código (`main`, ya pusheado)

- `9e0d6aa` → `eb859fb` → `3580bcf` (los tres en GitHub, `main`).
- Fichas de adhesión: en Postgres desde hace semanas, ya en uso.
- Grupos/Contratos/Pasajeros/Turismo (admin): adaptador completo en
  `lib/db.js`, ruteado en `server.js` detrás de la bandera
  `EAA_POSTGRES_MIGRATION_ENABLED` (agregada por Wilson en `eb859fb`).
  Probado en vivo contra Supabase real: CRUD por hoja, concurrencia (30
  simultáneos), validaciones cruzadas grupo↔contrato↔pasajero, enums
  estrictos, transacciones, aprobación de ficha atómica.
- Autenticación: 1 admin + 5 agentes con contraseña propia cada uno
  (`3580bcf`, revisándolo Wilson ahora). Se retiró la cuenta compartida
  `agencia`.
- Supabase: esquema completo aplicado y verificado (`npm run db:check`
  pasa las 10 tablas OK).
- Google Sheets: el código sigue en el repo (rollback rápido si hiciera
  falta) pero **no se va a usar** — no hay credenciales configuradas ni se
  van a configurar.

## Fase 1 — Deploy inicial en Hostinger

Web App `beige-beaver-153989` (Node.js, deploy desde GitHub, repo
`Render-audiovisual/el-angel-azul-web`, rama `main`).

**Build:**
- Entry file: `server.js` · Start command: `npm start`
- Node.js: 20 o 22 · Build/output: vacíos

**Variables de entorno a cargar:**
- `DATABASE_URL` — conexión a Supabase
- `EAA_POSTGRES_MIGRATION_ENABLED=true`
- `EAA_ADMIN_PASSWORD` — nueva, no reutilizar ninguna que haya aparecido en
  chats anteriores
- `EAA_AGENTE1_PASSWORD` a `EAA_AGENTE5_PASSWORD` — nuevas, una por agente
- `NODE_ENV=production`

**No cargar:** `GOOGLE_SHEETS_CREDENTIALS`, `GOOGLE_SHEETS_SPREADSHEET_ID`,
`PORT` (lo inyecta Hostinger solo).

**Deploy** → esperar estado Active/Running/Successful.

## Fase 2 — Verificación técnica (sin tocar credenciales)

- Confirmar que la Web App responde (URL pública temporal de Hostinger).
- Revisar logs de arranque por cualquier error (`Error en una conexión...`,
  `DATABASE_URL no configurada`, etc.).
- `GET /api/admin/me` sin sesión → debe dar `{"ok":true,"authenticated":false}`.
- `GET /api/google-sheets?sheet=GRUPOS` sin sesión → debe dar `200` con
  `rows: []` (público, tabla vacía real — no debe caer en ningún error ni
  sembrar datos de ejemplo).
- `GET /api/google-sheets?sheet=PASAJEROS` sin sesión → debe dar `401`
  (sigue exigiendo sesión, sin cambios).

## Fase 3 — Smoke test (con confirmación explícita en el momento, no automático)

- Login de las 6 cuentas (`admin` + `agente1`...`agente5`), cada una con
  su propia contraseña.
- Crear un grupo de prueba real desde el admin → confirmar que aparece →
  borrarlo (esto es una eliminación real, aunque sea de un dato de
  prueba — pedir OK explícito antes de ejecutarlo, no asumirlo).
- Confirmar que Inscripción pública carga bien (usa Grupos/Contratos
  reales para el matching de colegio).
- Confirmar que Turismo público (la página, no el admin) sigue igual —
  no depende de Postgres, lee `assets/data/turismo-paquetes.json` estático.
- Opcional pero recomendado: probar el flujo completo ficha pública →
  aprobar desde el admin → confirmar que crea el pasajero y linkea
  `inscripciones.pasajero_id`.

## Fase 4 — Contraseñas

- Confirmar que las 6 contraseñas cargadas en Hostinger son nuevas, no
  ninguna de las que se mencionaron en chats de prueba anteriores.
- Repartir a cada agente su propia contraseña por un canal directo (no
  por este mismo hilo de chat, que ya tiene otras contraseñas de ejemplo
  expuestas en el historial).

## Fase 5 — Cierre

- Unos días de uso real estable antes de dar la migración por cerrada.
- El cliente conecta su propio dominio cuando esté todo validado — lo
  maneja él directamente, no es parte de esta entrega.

## Fase 6 — Retirar el código muerto de Google Sheets (días después, no ahora)

Solo después de confirmar Fase 5 estable. En `server.js`: eliminar
`credentials()`, `accessToken()`, `sheetsRequest()`, `appendSheetRows()`,
`readSheet()`, `writeSheet()`, `cachedToken`, `SPREADSHEET_ID`,
`CREDENTIALS_PATH`, `GOOGLE_SHEETS_CREDENTIALS_JSON`. De `SCHEMA` sacar
solo las entradas `PAGOS`/`CUOTAS` (nunca tuvieron escritura real
habilitada). No tocar `assets/js/modules/persistence.js` — los nombres
`fetchGoogleSheetRows`/`writeGoogleSheetRows` son el contrato HTTP
heredado, renombrarlos sería cosmético e innecesario.

## Riesgo a tener en cuenta

Con Railway caído y sin credenciales de Sheets configuradas en Hostinger,
**ya no existe un rollback funcional a Sheets** como lo planeaba
originalmente esta migración (esa opción asumía que Railway seguía vivo
como red de contención). El único rollback real hoy es: revertir el
commit que activa `EAA_POSTGRES_MIGRATION_ENABLED` — pero como arrancamos
sin backfill, no hay datos en Sheets que se pierdan por eso, solo se
perdería lo que se haya cargado en Postgres durante la ventana. Vale la
pena que el cliente lo sepa antes de la Fase 3.
