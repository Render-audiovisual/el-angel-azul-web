# Arquitectura – El Ángel Azul

Leer esto ANTES de abrir código. `assets/js/app.js` pesa ~474 KB: nunca leerlo entero, buscar con grep.

## Stack y despliegue
- Node sin framework (`server.js`, 1110 líneas) + SPA en `assets/js/app.js` (9227 líneas) + `assets/css/styles.css`.
- Base: Postgres en Supabase, proyecto "Angel Azul base" (`gruwkiuswpnbzywcoftz`). Acceso solo por el servidor (`DATABASE_URL`); RLS activo sin políticas.
- Deploy: Hostinger, automático desde `main`.
- Migraciones: `supabase/migrations/0001–0004`.

## Mapa del código
| Capa | Archivo | Qué hace |
|---|---|---|
| Servidor y rutas | `server.js` | Login admin, rutas públicas, `/api/google-sheets?sheet=X`, rate limit, estáticos |
| Base | `lib/db.js` (1571 líneas) | Todas las consultas. Exports: `insertFichaPublica`, `insertFichaTutor`, `contextoInscripcion`, `list*Admin` / `save*Admin` de Colegios, Grupos, Contratos, Planes, Pasajeros, Fichas, Turismo |
| Correo | `lib/email.js` | Resend. Apagado sin `RESEND_API_KEY`, `EAA_EMAIL_FROM`, `EAA_EMAIL_COPIA` |
| PDF | `lib/ficha-pdf.js` | pdf-lib |
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

## Estado y dueños (3 agentes)
- A (fichas): ficha PAX/Tutor, validación, 409 de duplicados, PDF. Rama `feat/ficha-estabilizacion`.
- B (colegios admin + vista de pertenencia): no entregado.
- C (Excel, PDF, correo, Storage): Excel/PDF/correo hechos; Storage pendiente.
- Regla: un agente = un worktree = una rama. Nada de `git add .`.

## Plan por fases (orden obligatorio)
1. **Datos de producción**: cargar colegios, viajes, contratos, planes y grupos en Supabase (hoy 0). Lo hace el admin ya existente o un script revisado. Sin esto no hay fichas.
2. **Cerrar A + C**: commitear por separado, `npm run check` + E2E en verde, una PR por agente a `main`.
3. **B**: ABM de colegios en admin y vista Colegio → Curso → División → Plan → Tutor.
4. **Correo**: variables de entorno + DNS de `elangelazul.tur.ar`.
5. **Endurecer**: admin sin datos demo cuando falla la base; clave de idempotencia; calle sin HTML; rotar `EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD`.
6. **Storage de firma** (diferido).
7. **Partir `app.js` por pantalla + rediseño** (último).

## Reglas para gastar pocos tokens
- Leer este archivo y el spec `docs/superpowers/specs/2026-09-15-ficha-adhesion-design.md`; nada más hasta tocar código.
- `grep -n` por nombre de función; leer solo el rango necesario.
- Una tarea por sesión, con criterio de fin = tests en verde.
- Entregar un resumen de ≤15 líneas: archivos tocados, tests, pendientes.
- Probar contra la base local (PGlite) antes de tocar Supabase.
- Escribir en Supabase de producción solo con confirmación del dueño.

## Comandos
- `npm test` (88 tests) · `npm run check` · `npm run db:check`.
- E2E: `PLAYWRIGHT_PATH=<node_modules/playwright> node scripts/e2e/ficha.e2e.js` (no corre en `npm test`).
