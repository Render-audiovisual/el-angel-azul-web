# Traspaso a Codex – El Ángel Azul (17/11/2026)

Para quien siga este trabajo con Codex u otro agente. Leé este archivo, después `docs/ARQUITECTURA.md`, y seguí desde «Qué sigue».

## Actualización del 20/11/2026

- Consignas del cliente y estado de cada punto en `docs/CONSIGNAS-CLIENTE.md`. Objetivo confirmado: toda la inscripción online.
- Nueva prueba HTTP + PGlite del circuito completo de ficha, tutor, admin, aprobación y PDF: `scripts/inscripcion-online.test.js`. `npm run check`: 117 aprobadas.
- Corregida la confirmación de correo: guardar la ficha no implica haber enviado la copia. API devuelve `emailEstado`; la pantalla distingue el envío pendiente del guardado.
- El 17/11 se creó la PR #3 y un sitio independiente de previsualización en Hostinger (`devoted-sienna-fox-25.hostingersite.com`) sin base conectada. `main` no se fusionó en esa sesión.
- El proyecto «Angel Azul base» no figura en las conexiones de Supabase disponibles el 20/11. No se verificaron ni modificaron sus datos/migraciones; los estados de producción mencionados abajo corresponden al traspaso original.

## Dónde está el código
- Repo: https://github.com/Render-audiovisual/el-angel-azul-web (privado: hay que tener acceso a la organización).
- Clonar y pararse en la rama de trabajo:

```bash
git clone https://github.com/Render-audiovisual/el-angel-azul-web.git
cd el-angel-azul-web
git checkout feat/colegios-padron
npm ci
npm run check      # 116 tests; usan Postgres en memoria (PGlite), no tocan Supabase
```

## Contexto en pocas líneas
- Web de viajes estudiantiles. Node sin framework (`server.js`) + SPA en `assets/js/app.js` (~9500 líneas, ~474 KB: **nunca leerlo entero**, usar `grep -n` y leer el rango).
- Producción: Hostinger (deploy automático desde `main`) + base Supabase «Angel Azul base». Hoy la base tiene casi todo vacío (0 contratos, grupos, pasajeros, fichas; 2 colegios de prueba), así que nadie puede enviar una ficha real todavía.
- Todo lo de este traspaso se trabajó **en local, nada está desplegado**.
- **Lo escrito antes de noviembre de 2026 está desactualizado** (por ejemplo `contexto proyecto/*` habla de Railway; el hosting real es Hostinger). Fuentes vigentes: este archivo, `docs/ARQUITECTURA.md`, `docs/HANDOFF-SESION.md` y `docs/superpowers/plans/2026-11-10-plan-mejora-angel-azul.md`.

## Reglas del dueño (no negociables)
- Toda escritura en Supabase y todo push a `main` los aprueba el dueño antes. No pedir ni mostrar `DATABASE_URL`; los secretos nunca pasan por chat.
- Respuestas al dueño en español, cortas. Textos de la web en español rioplatense (vos).
- No usar `git add .`: agregar archivos por nombre. Los archivos de `lib/`, `server.js` y `app.js` pueden venir en CRLF si se editan en Windows; no mezclar fines de línea.

## Mapa de ramas (todas en GitHub)
| Rama | Qué es |
|---|---|
| `main` | Producción. Último commit 01/10/2026 (Ficha de Adhesión v2, Fase 1). |
| `integracion/abc` | Reúne las ramas de noviembre: estabilización de la ficha, Colegios admin, firma en Storage, doble envío (migración 0006), accesibilidad y selector de grupo. **Candidata a `main`.** 113 tests. |
| `feat/colegios-padron` | **Rama de trabajo actual.** Sale de `integracion/abc` y suma el importador del Padrón de colegios (Fase 2). 116 tests. |
| `feat/ficha-estabilizacion` | Rama A. Además tiene docs de contexto (`b65f7ef`) que no están en `integracion/abc`. |
| `feat/colegios-admin`, `feat/storage-firma`, `feat/db-doble-envio`, `feat/frontend-pasajeros-a11y` | Ramas B, C, E, D, ya incluidas en `integracion/abc`. |
| `fix/migracion-supabase-segura`, `feat/ficha-adhesion-v2`, `fix/ficha-v2-release` | Anteriores a noviembre; ignorar. |

## Qué se hizo en esta sesión (Fase 2 de Colegios)
La pantalla Colegios del admin ya estaba hecha en `integracion/abc`. Faltaba importar el Padrón oficial:
- `lib/padron.js`: lee el `.xlsx` sin dependencias nuevas (zip con `zlib` + regex sobre el XML) y hace el upsert.
- `scripts/import-padron-colegios.js`: el comando.
- `scripts/padron.test.js`: 3 tests (lectura y filtro, formato distinto, upsert repetible).
- Sección «Importar el Padrón de colegios» en `README.md`.

Cómo funciona:
- Fuente: Padrón Oficial de Establecimientos Educativos, de argentina.gob.ar (Ministerio de Educación → Padrón Oficial). Versión probada: 07/09/2026. La URL del archivo cambia con cada versión; se saca de esa página.
- Se importan los establecimientos **comunes con primario o secundario** de Corrientes y Misiones (`--provincias=` cambia la lista). Resultado con el archivo real: **2.929** (1.170 Corrientes, 1.759 Misiones).
- El CUE (columna Cueanexo) queda como `codigo_oficial`.
- Un colegio cargado a mano con el mismo nombre se **vincula** en vez de duplicarse. Si el nombre ya existe con otro código, se agrega la localidad. Reimportar no pisa nombres editados ni reactiva colegios dados de baja.

```bash
node scripts/import-padron-colegios.js padron.xlsx                           # solo lee el archivo
DATABASE_URL=... node scripts/import-padron-colegios.js padron.xlsx          # simula y revierte
DATABASE_URL=... node scripts/import-padron-colegios.js padron.xlsx --aplicar  # guarda (pedir OK al dueño)
```

## Qué sigue (en orden)
1. Revisar que Grupos y Contratos elijan el colegio de la lista (spec `docs/superpowers/specs/2026-09-15-ficha-adhesion-design.md`, sección 5.1). `findOrCreateColegio` ya no existe en el código, pero las pantallas no se verificaron.
2. Probar en el navegador el buscador público de colegios con ~2.900 entradas. `GET /api/public/colegios` devuelve todos los activos sin paginar; si pesa o se traba, paginar o filtrar en el servidor.
3. Con OK del dueño: correr el importador con `--aplicar` contra Supabase (primero la simulación).
4. Carga real en Supabase (con OK): viajes («Bariloche 2027» exacto), grupos, contratos y planes de pago. **Todo registro lleva `legacy_id`**; sin él el admin muestra `id: null`.
5. Entrega: mergear `integracion/abc` y esta rama a `main`, aplicar las migraciones 0005 y 0006 en Supabase (hoy NO aplicadas), subir y cargar variables en Hostinger (`EAA_POSTGRES_MIGRATION_ENABLED=true`; las de Storage y correo si se activan).
6. Correo (Resend): `RESEND_API_KEY`, `EAA_EMAIL_FROM`, `EAA_EMAIL_COPIA` y DNS de `elangelazul.tur.ar` (la delegación a AWS Route 53 está muerta). Corregir el email de contacto del sitio (`contacto@elangelazul.com.ar` no existe).
7. Endurecer: confirmar la IP real detrás del proxy de Hostinger (`X-Forwarded-For`), que el admin no muestre 200 pasajeros de demostración cuando falla la base, calle sin HTML, rotar `EAA_ADMIN_PASSWORD` / `EAA_AGENCIA_PASSWORD` (la vieja quedó en el historial público de git). Decidir si se borra `admin/colegios/index.html` (inalcanzable).
8. Actualizar `docs/ARQUITECTURA.md` cuando cambie el número de tests o migraciones.
9. Pendientes viejos: paquete «Bariloche» de ejemplo en Sheets, Sucursales en Home. El rediseño visual va al final.

## Cómo probar
- `npm run check` = `node --check` de `server.js` y `app.js` + todos los tests. No necesita base ni red.
- Probar el servidor con una base local: ver «Entorno local de pruebas» en `docs/HANDOFF-SESION.md`.
- E2E con Playwright: `scripts/e2e/ficha.e2e.js` y `scripts/e2e/colegios.e2e.js`, con `PLAYWRIGHT_PATH` apuntando a `node_modules/playwright`.
