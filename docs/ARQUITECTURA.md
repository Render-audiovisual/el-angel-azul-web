# Arquitectura – El Ángel Azul

Leer esto ANTES de abrir código. `assets/js/app.js` pesa ~474 KB: nunca leerlo entero, buscar con grep.

## Stack y despliegue
- Node sin framework (`server.js`, ~1160 líneas) + SPA en `assets/js/app.js` (~9500 líneas) + `assets/css/styles.css`.
- Base: Postgres en Supabase, proyecto "Angel Azul base" (`gruwkiuswpnbzywcoftz`). Acceso solo por el servidor (`DATABASE_URL`); RLS activo sin políticas.
- Deploy: Hostinger, automático desde `main`.
- Migraciones: `supabase/migrations/0001–0007` (0005 = bucket de firmas, 0006 = índices únicos contra doble envío, 0007 = índices de claves foráneas). 0007 se aplicó el 27/11/2026 (8 índices verificados en Supabase). 0001 a 0007 están aplicadas en Supabase (0005 y 0006 el 26/11/2026; 0001 y 0002 no figuran en la lista de migraciones de Supabase, ya era así antes).

## Mapa del código
| Capa | Archivo | Qué hace |
|---|---|---|
| Servidor y rutas | `server.js` | Login admin, rutas públicas, `/api/google-sheets?sheet=X`, rate limit, estáticos |
| Concurrencia del admin | `lib/admin-write.js` | Versiones por registro, bloqueo transaccional y savepoints; `persistence.js` envía solo filas modificadas |
| Base | `lib/db.js` (~1600 líneas) | Todas las consultas. Exports: `insertFichaPublica`, `insertFichaTutor`, `contextoInscripcion`, `list*Admin` / `save*Admin` de Colegios, Grupos, Contratos, Planes, Pasajeros, Fichas, Turismo |
| Storage | `lib/storage.js` | Firma en bucket privado `fichas` (subir, leer, borrar). Apagado sin `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` |
| Correo | `lib/email.js` | Resend. Apagado sin `RESEND_API_KEY`, `EAA_EMAIL_FROM`, `EAA_EMAIL_COPIA` |
| PDF | `lib/ficha-pdf.js` | pdf-lib |
| Padrón de colegios | `lib/padron.js`, `scripts/import-padron-colegios.js` | Lee el .xlsx del Padrón Oficial (sin dependencias) y hace upsert en `colegios` por `codigo_oficial` |
| Validación | `assets/js/modules/ficha-validation.js` | UMD: el mismo código valida en el formulario y en el servidor |
| SPA | `assets/js/app.js` | Todas las pantallas (ver abajo) |
| Módulos viejos | `assets/js/modules/*.js` | Pequeños (forms, groups, passengers, payments, persistence, portal) |
| Paneles | `admin/`, `admin-turismo/` | HTML de entrada del admin |

## Rutas
- Públicas: `GET /api/public/colegios`, `GET /api/public/inscripcion-context`, `POST /api/public/fichas`, `POST /api/public/fichas-tutor`.
- Admin: `/api/admin/login|logout|me`, `/api/admin/fichas/:id/pdf`, `/reenviar-correo`.
- Datos admin: `/api/google-sheets?sheet=X` con cookie de sesión.
  - Con `EAA_POSTGRES_MIGRATION_ENABLED=true` van a Postgres: GRUPOS, CONTRATOS, PASAJEROS, TURISMO, CONFIG, FICHAS_TUTOR, PLANES_PAGO, COLEGIOS.
  - Sin esa variable (o para hojas fuera de la lista) van a Google Sheets.
  - **Verificar en Hostinger que la variable esté en `true`.**

## Modelo de datos (resumen)
colegios → grupos (curso+división, por viaje) → pasajeros → personas; contratos (por colegio+nivel+viaje) → planes_pago; inscripciones → fichas_adhesion; fichas_tutor; responsables vinculados por `pasajero_responsables`.
`contextoInscripcion` cruza colegio_id + nivel + `viajes.destino` (texto, ej. "Bariloche 2027") + grado + división. Sin contrato y plan cargados, la ficha no se puede enviar.

## Estado y plan
Estado, tablero «En curso» y pasos pendientes en `docs/HANDOFF-CODEX.md`. Reglas y checklist de sesión en `AGENTS.md`. Rama de trabajo: `feat/colegios-padron` (PR #3). `docs/HANDOFF-SESION.md` y el plan del 10/11 quedan como historia.

## Fallas conocidas
Errores que ya pasaron o que van a pasar si nadie los mira. Cada uno dice qué lo detecta.

| Falla | Detección |
|---|---|
| El viaje se guarda como destino + año («Bariloche 2027»). Con «Bariloche» a secas, el contrato no se encuentra y la ficha no se puede enviar. | Manual: datos de prueba de `npm run dev`. Revisar al cargar viajes reales (Paso 5). |
| Un registro sin `legacy_id` aparece en el admin como `id: null`. | Manual al cargar datos reales (Paso 5). |
| Si Hostinger agrega un proxy de más, `clientIp` devuelve la misma IP para todos: 50 fichas por hora para todo el sitio y 5 claves malas bloquean el login de todos. | Pendiente: test de `clientIp` con los encabezados reales de Hostinger (Paso 2). |
| El PDF pierde letras fuera de Latin-1 («Mićić» sale «Mii»). | Pendiente: caso en `scripts/ficha-pdf.test.js` cuando se corrija `textoSeguro`. |
| Una contraseña vieja del admin quedó en el historial público de git. | `scripts/guardas.test.js` bloquea secretos nuevos. La vieja se rota en el Paso 7. |
| Deuda de seguridad del Paso 3 (TLS, CDN sin `integrity`, CONFIG pública, viajes creados desde la ficha, roles, auditoría). | `todo` en `scripts/guardas.test.js`; se ven en cada `npm run check`. |

## Reglas para gastar pocos tokens
- Leer este archivo y el spec `docs/superpowers/specs/2026-09-15-ficha-adhesion-design.md`; nada más hasta tocar código.
- `grep -n` por nombre de función; leer solo el rango necesario.
- Una tarea por sesión, con criterio de fin = tests en verde.
- Entregar un resumen de ≤15 líneas: archivos tocados, tests, pendientes.
- Probar contra la base local (PGlite) antes de tocar Supabase.
- Escribir en Supabase de producción solo con confirmación del dueño.

## Comandos
- `npm test` (tests y guardas; borra las variables secretas antes de correr) · `npm run check` (sintaxis + `npm test`) · `npm run db:check`.
- E2E: `PLAYWRIGHT_PATH=<node_modules/playwright> node scripts/e2e/ficha.e2e.js` (no corre en `npm test`).
