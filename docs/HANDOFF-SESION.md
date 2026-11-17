# Handoff – El Ángel Azul (13/11/2026)

Para arrancar una sesión nueva de Claude Code, pegar:
"Leé docs/HANDOFF-SESION.md, docs/ARQUITECTURA.md y docs/superpowers/plans/2026-11-10-plan-mejora-angel-azul.md y seguí desde 'Qué falta'."

## Contexto en 5 líneas
- Web de viajes estudiantiles. Repo `Render-audiovisual/el-angel-azul-web` (**público**: nunca commitear `.env`, claves ni datos de familias).
- Node sin framework (`server.js`) + SPA `assets/js/app.js` (~9500 líneas, no leer entero) + Postgres en Supabase "Angel Azul base" (`gruwkiuswpnbzywcoftz`).
- Producción: Hostinger con **deploy automático desde `main`**. Hacer push a `main` = publicar.
- Objetivo actual: estabilizar la Ficha de Adhesión (12 consignas del cliente) antes de la carga real. Rediseño al final.
- El dueño aprueba cada escritura en Supabase de producción y cada push a `main`.

## Dónde está el trabajo
- **Rama de trabajo: `integracion/abc`.** Tiene todo lo hecho, 113/113 tests. `main` está 18+ commits atrás y **no** se tocó (para no desplegar sin migraciones).
- Ramas de origen (ya mergeadas en `integracion/abc`, se pueden borrar más adelante): `feat/ficha-estabilizacion`, `feat/colegios-admin`, `feat/storage-firma`, `feat/db-doble-envio`, `feat/frontend-pasajeros-a11y`.

## Hecho
- Ficha PAX y Tutor: validación compartida cliente/servidor, planes de pago, dirección, CUIL, PDF, Excel (28 columnas), correo Resend (apagado hasta configurar).
- Pantalla Colegios en admin, Tutor en la pertenencia del pasajero.
- Firma en Supabase Storage (bucket privado `fichas`, migración 0005; apagada sin `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`).
- Seguridad: cookie mal formada sin 500, límite de login por usuario, `firma_bucket` correcto.
- Plan de mejora Fase A (13/11):
  - T1 migración 0006: índices únicos contra doble envío; error 23505 → 409.
  - T2 una ficha pública no pisa nacimiento/teléfono de una persona ya cargada; edad calculada con fecha Argentina.
  - T3 si la ficha falla, se borra la firma subida a Storage.
  - T4 selector de grupo en Pasajeros (sin grupo: error, no guarda).
  - T5 firma por teclado (nombre escrito → mismo PNG).
  - T6 foco en la pantalla de éxito; errores fuera del `<label>` con `aria-describedby`.

## Qué falta (en orden)
1. **Consignas del cliente (12 puntos):** pegarlas en `docs/CONSIGNAS-CLIENTE.md`, cruzarlas con lo hecho (Task 8 del plan) y convertir las pendientes en tareas.
2. **Deploy (con OK del dueño):** aplicar migraciones 0005 y 0006 en Supabase → merge `integracion/abc` a `main` → push → en Hostinger `EAA_POSTGRES_MIGRATION_ENABLED=true`. Las migraciones van junto con el deploy, no antes.
3. **Carga real en Supabase:** colegios, viajes ("Bariloche 2027" exacto), grupos, contratos, planes. Todo registro con `legacy_id`. Hoy hay 0 contratos/planes/grupos: sin eso nadie puede enviar la ficha.
4. **Correo:** `RESEND_API_KEY`, `EAA_EMAIL_FROM`, `EAA_EMAIL_COPIA` + DNS de `elangelazul.tur.ar`.
5. **Endurecer:** IP real tras el proxy de Hostinger, admin sin pasajeros demo si falla la base, calle sin HTML, rotar `EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD`, decidir `admin/colegios/index.html`.
6. **Mejoras de tests sugeridas por revisores:** test HTTP real del borrado de firma en Storage; tests de frontend por comportamiento (hoy buscan texto en el código).
7. Pendientes viejos sin priorizar: placeholder de Bariloche en Sheets, Sucursales en Home, rediseño.

## Arrancar en una máquina nueva (Mac)
```bash
git clone https://github.com/Render-audiovisual/el-angel-azul-web.git
cd el-angel-azul-web
git checkout integracion/abc
npm ci            # requiere Node >= 20
npm test          # esperado: 113 pass, 0 fail
```
- `.env` no está en el repo: pedirlo al dueño o copiarlo a mano (nunca por chat ni commit). Para tests no hace falta: usan PGlite en memoria.
- Servidor local con base en memoria: los tests ya la levantan solos (`scripts/helpers/pglite-pool.js`). Para usar la app en el navegador hace falta un `DATABASE_URL` (local o Supabase).
- Finales de línea: en Windows los archivos están en CRLF; en Mac quedan en LF. Git lo maneja solo; no convertir a mano.

## Reglas de trabajo
- Un agente = una rama (o un worktree). Nunca `git add .`: agregar archivos por nombre.
- Cada tarea: test que falla → arreglo → `npm run check` en verde → commit.
- Si algo falla dos veces: Plan B de la tarea (está escrito en el plan) o marcarla bloqueada y seguir.
- Respuestas al dueño: español, cortas.
