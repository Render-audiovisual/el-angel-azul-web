# Handoff de sesión – El Ángel Azul (10/11/2026)

Pegar en la sesión nueva: "Leé docs/HANDOFF-SESION.md y docs/ARQUITECTURA.md y seguí desde 'Qué sigue'".

## Contexto en 6 líneas
- Web de viajes estudiantiles. Repo `Render-audiovisual/el-angel-azul-web`, local `C:\Users\Franco\Desktop\RENDER WEBS\angel azul web\el-angel-azul-web`. Node sin framework + SPA `assets/js/app.js` (CRLF, no leer entero).
- Producción: Hostinger (deploy automático desde `main`) + base **Supabase "Angel Azul base"** (`gruwkiuswpnbzywcoftz`, plan gratuito, activa).
- Supabase hoy: tablas OK (migraciones 0003/0004), **0 contratos, 0 planes, 0 grupos, 0 pasajeros, 0 fichas**, 2 colegios de prueba, 3 viajes. Sin eso nadie puede enviar la ficha (el plan de pago es obligatorio).
- Objetivo: estabilizar la Ficha de Adhesión según los 12 puntos del cliente. El rediseño va al final.
- El dueño aprueba cada escritura en Supabase y cada push a `main`. No pedir ni mostrar `DATABASE_URL`.
- Respuestas al dueño: español, terse.

## Ramas y worktrees (carpeta `angel azul web\`)
| Carpeta | Rama | Estado |
|---|---|---|
| `el-angel-azul-web` | `feat/ficha-estabilizacion` | A: commits `6dc5cf1`, `c7688ad`. 88 tests |
| `eaa-B` | `feat/colegios-admin` | B: `941a5ee` (pantalla Colegios, Tutor en pertenencia). 86 tests |
| `eaa-C` | `feat/storage-firma` | C: `9ec1edb` (firma en Supabase Storage, migración 0005 NO aplicada) |
| `eaa-INT` | `integracion/abc` | A+C+B mergeadas sin conflictos + arreglos (`01172c8`, `a4e98fe`, `f529207`). **102/102 tests**. Candidata a `main`. Nada subido |

## Hecho (resumen)
Ficha PAX/Tutor completa (validación compartida, 409 por duplicado, planes de pago, dirección, CUIL), PDF y Excel (28 columnas, fecha Argentina), correo Resend (apagado: faltan variables y DNS), pantalla Colegios, Tutor en pertenencia, firma en Storage (apagada sin `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`), arreglos de seguridad (cookie mal formada, límite de login por usuario, `firma_bucket`) y accesibilidad (errores con `aria-describedby`, checkbox, foco en Colegios). Auditorías por 3 agentes (QA E2E, seguridad, código+a11y) hechas.
Skills instaladas en el repo: context-engineering, harness-engineering, supabase-postgres-best-practices, webapp-testing, security-review, accessibility-audit.

## Qué sigue (en orden)
1. **Migración 0006** (primero en base local): índices únicos parciales contra doble envío (`fichas_adhesion` por inscripción activa; `fichas_tutor` por DNI pasajero+tutor), mapear `23505` a 409.
2. Borrar firma suelta en Storage si la ficha da 409/500 (o subir después del chequeo). No pisar `nacimiento`/`telefono` de una persona existente (`lib/db.js` `findOrCreatePersona`, usar `coalesce(personas.x, excluded.x)`). Validar fecha de nacimiento con fecha Argentina, no UTC.
3. **Pantalla Pasajeros sin selector de grupo** (`app.js` ~6280): el formulario usa el primer grupo. Arreglar antes de la carga real.
4. Accesibilidad pendiente: firma sin alternativa de teclado (obligatoria, bloquea a quien no usa mouse/táctil), foco en pantalla de éxito, errores dentro del `<label>`.
5. **Carga real en Supabase** (con OK del dueño): colegios reales, viajes ("Bariloche 2027" exacto), grupos, contratos, planes. **Todo registro debe llevar `legacy_id`** (el admin usa `legacy_id` como id; sin él aparece `id: null`).
6. Mergear a `main` (ya integrada en `integracion/abc`), aplicar 0005/0006 con OK, subir, cargar variables en Hostinger (`EAA_POSTGRES_MIGRATION_ENABLED=true`; las de Storage y correo si se activan).
7. Correo: `RESEND_API_KEY`, `EAA_EMAIL_FROM`, `EAA_EMAIL_COPIA` + DNS de `elangelazul.tur.ar` (delegación AWS muerta).
8. Endurecer: confirmar IP real tras el proxy de Hostinger (`X-Forwarded-For`), admin sin 200 pasajeros demo cuando falla la base, calle sin HTML, rotar `EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD`, decidir si se borra `admin/colegios/index.html` (inalcanzable). Actualizar `docs/ARQUITECTURA.md` (dice migraciones 0001–0004 y 88 tests).
9. Pendientes viejos: Bariloche placeholder en Sheets, Sucursales en Home. Rediseño al final.

## Uso de los conectores nuevos (Firewall, Perplexity, Playwright)
- Playwright: reemplaza mis scripts con `playwright-core`; mismos casos (ver abajo) contra el servidor local.
- Perplexity: investigar proxy/headers de Hostinger y buenas prácticas de rate limit.
- Firewall: revisar reglas para `/api/public/*` y `/api/admin/login`.
- Verificar con `ToolSearch` que los tools aparezcan antes de usarlos.

## Entorno local de pruebas (se pierde al cerrar sesión)
- Base en memoria PGlite en `127.0.0.1:54329` (UNA sola conexión; si algo falla con 500, reiniciar la base). Scripts viejos en `C:\Users\Franco\AppData\Local\Temp\claude\c--Users-Franco-Desktop-RENDER-WEBS-litoral-maq-ecommerce\e51a58fa-52de-4e12-97ec-9649868dd291\scratchpad\e2e\`: `db.mjs` (base), `seed.cjs`, `seed2.cjs`, `seed3.cjs` (datos + contratos/planes), `nossl.cjs` (`node -r`, quita SSL y fija `max=1`; resuelve `pg` desde el cwd), `e2e.cjs`, `export.cjs`, `a11y.cjs`.
- Servidor: `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54329/postgres EAA_POSTGRES_MIGRATION_ENABLED=true EAA_ADMIN_PASSWORD=TestAdmin-123456 PORT=3057 NODE_ENV=development node -r <ruta>/nossl.cjs server.js` desde `eaa-INT`. Admin: `admin` / `TestAdmin-123456` (solo local).
- Tests: `npm test` (102 en INT). E2E manual: `scripts/e2e/ficha.e2e.js`, `colegios.e2e.js` con `PLAYWRIGHT_PATH`.
- En Git Bash usar `MSYS_NO_PATHCONV=1` al probar rutas con curl. Los archivos son CRLF: editar con script que normalice.
