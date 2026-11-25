# Traspaso del proyecto – El Ángel Azul (24/11/2026)

Escrito para el programador que sigue el trabajo (con Codex, Claude Code u otro agente). Leé este archivo entero, después `docs/ARQUITECTURA.md`, y seguí desde el primer paso pendiente de la sección 5.

## Integración de Codex (24/11/2026)

- Se integró el traspaso `0c9d626` con el commit local `1c3bde0`: confirmación de correo pendiente y prueba HTTP completa de inscripción. Base integrada: 117 pruebas. Guardado concurrente terminado: 130 pruebas aprobadas.
- Hostinger fue verificado como hosting el 17/11. Se creó una previsualización independiente sin base conectada (`devoted-sienna-fox-25.hostingersite.com`), además de la vista previa automática del PR #3. No se modificó `main`.
- Se trabaja en `fix/admin-guardado-concurrente`, sin escrituras en la base real.

## 1. Qué es y dónde está
- Web de viajes estudiantiles: sitio público, ficha de adhesión online (PAX y Tutor) y panel de administración. Node sin framework (`server.js`) + una SPA en `assets/js/app.js` (~9.500 líneas: **no la leas entera**, usá `grep -n` y leé el rango). Datos en Postgres (Supabase).
- Repo: https://github.com/Render-audiovisual/el-angel-azul-web (privado: pedí acceso a la organización).
- **Rama de trabajo: `feat/colegios-padron`**. Está abierto el PR #3 hacia `main` (no mergear sin OK del dueño). Hostinger arma una vista previa por cada push: https://hushed-teal-stingray-74.hostingersite.com (no verificado a qué base apunta; confirmalo antes de usarla con datos).
- **Nada está desplegado todavía.** Todo se trabajó en local.
- Lo escrito antes de noviembre de 2026 está desactualizado (`contexto proyecto/*` habla de Railway). Vigentes: este archivo, `docs/ARQUITECTURA.md`, `docs/correcciones-del-angel.md` y `docs/superpowers/plans/2026-11-10-plan-mejora-angel-azul.md`.

## 2. Reglas del dueño (no negociables)
- Toda escritura en Supabase y todo push o merge a `main` los aprueba el dueño antes.
- `DATABASE_URL` y demás secretos nunca se piden, se muestran ni pasan por chat.
- Respuestas al dueño en español, cortas. Textos de la web en español rioplatense (vos).
- `git add` por nombre de archivo, nunca `git add .`.
- Por ahora decide el dueño; el frontend (rediseño visual) va al final.

## 3. Arranque rápido
```bash
git clone https://github.com/Render-audiovisual/el-angel-azul-web.git
cd el-angel-azul-web
git checkout feat/colegios-padron
npm ci
npm run check     # 130 tests, sin red ni base real (usa PGlite en memoria)
npm run dev       # web local en http://localhost:3057
```
`npm run dev` levanta el servidor real con una base en memoria y datos de prueba: 3 colegios, «Bariloche 2027» y un contrato `LOCAL-001` (5° B de «Escuela Normal N° 1») con 2 planes. Admin: usuario `admin`, clave `TestAdmin-123456` (solo local). Los datos se pierden al cortarlo. Ignora cualquier clave real de Supabase o Resend que tengas exportada.
- Ojo: el viaje se guarda como destino + año en un solo texto («Bariloche 2027»). Si cargás «Bariloche» a secas, el contrato no se encuentra.
- El buscador de colegio de la ficha es una lista nativa del navegador: hay que elegir la opción («Escuela Normal N° 1 — Goya»).
- Las secciones del formulario aparecen al hacer scroll (animación); si automatizás con Playwright, hacé scroll real con `mouse.wheel`.

## 4. Estado
**Hecho en código (nada desplegado):** los 12 puntos del cliente tienen su parte hecha. El detalle punto por punto, con lo que falta de cada uno, está en `docs/correcciones-del-angel.md`.
**Verificado a mano en el navegador local (ficha PAX):** selector PAX/Tutor, curso/grado/división, nombre y apellido separados con aviso de tildes, validación (bloquea y lista los 20 datos faltantes), CUIL/correo/celular del tutor, plan de pago, dirección, envío 201 y ficha guardada con colegio, contrato y plan; el PDF sale con «APELLIDO, NOMBRE» y el plan.
**Revisado a mano el 25/11 (Paso 4):** formulario de Tutor, ficha PAX en celular (390 px), pantalla Fichas del admin, aprobación, exportación a Excel y PDF. Resultado y 9 fallas anotadas en `docs/correcciones-del-angel.md`. La principal: el PDF pierde las letras fuera de Latin-1 («Mićić» sale «MII»).
**Todavía sin revisar:** el buscador con ~2.900 colegios, un correo real y Safari/iPhone reales.
**Depende de configuración externa:** correo (Resend) apagado: faltan `RESEND_API_KEY`, `EAA_EMAIL_FROM`, `EAA_EMAIL_COPIA` y el DNS de `elangelazul.tur.ar` (la delegación a AWS está muerta). La base real está casi vacía (0 planes, 0 contratos) y faltan las migraciones 0005 y 0006.

## 5. Pasos para seguir (en orden)
Cada paso termina con `npm run check` en verde y un commit chico. Si tocás algo del admin, probalo con `npm run dev`.

**Paso 1 – Guardado del admin: resuelto en `fix/admin-guardado-concurrente` (24/11).**
- El navegador captura una base normalizada al hidratar y manda solo altas/filas modificadas y bajas explícitas. Cambios hechos durante un envío siguen pendientes; ante error no avanza la base local.
- Postgres devuelve `_version` por registro (incluye `updated_at` con microsegundos). Se verifica la versión bajo bloqueo y dentro de la misma transacción del guardado. Dos sesiones que editan la misma versión: una guarda y la otra recibe HTTP 409. Registros distintos pueden guardarse sin sobrescribir datos ajenos.
- Los lotes protegidos se confirman completos o se revierten completos; no quedan filas parcialmente guardadas si alguna falla. Las transacciones de los adaptadores existentes usan savepoints dentro del pedido protegido.
- Colegios conserva el borrador visible ante conflicto. La interfaz pide recargar y revisar la versión actual; no reintenta automáticamente con una versión ajena.
- Protegidos: Fichas PAX/Tutor, Grupos, Contratos, Pasajeros, Colegios, Planes y Turismo, con `EAA_POSTGRES_MIGRATION_ENABLED=true`. El adaptador legado de Google Sheets sigue disponible, sin garantía de concurrencia entre procesos; la protección descrita es para Postgres.
- No requiere migración de esquema. Publicar frontend y servidor juntos; un cliente anterior sin versión recibe 409 al editar registros existentes y debe recargar.
- Pruebas: `npm run check` 130/130; prueba HTTP con cuentas admin/agente distintas, envíos simultáneos, lotes, bajas obsoletas y todas las colecciones. Prueba del navegador con dos pestañas de Colegios: el primer cambio persiste, el segundo se bloquea y conserva el borrador. Prueba de 120 fichas: el POST contiene una fila (~12 KB), no la colección (>1 MB).
- `npm run dev` usa IDs legados en los datos de prueba y fuerza la contraseña local, sin heredar ni imprimir una contraseña real del entorno.

**Paso 2 – IP del visitante en Hostinger** (`clientIp`, `server.js` ~190). Hoy toma la última IP de `X-Forwarded-For`, pensado para Render. Confirmar qué manda Hostinger; si hay un proxy más, todos los visitantes comparten límite (50 fichas por hora para todo el sitio y 5 contraseñas malas bloquean el login de todos).

**Paso 3 – Seguridad del servidor.**
- Roles: el servidor nunca mira `role` (`ADMIN_USERS`, `handleSheets` en `server.js`); cualquier agente puede borrar grupos o contratos con curl. Definir qué puede hacer cada rol, chequearlo en el servidor y escribir un test que lo pruebe (el test actual de «Configuración bloqueada» solo lee texto de `app.js`).
- Auditoría: solo las fichas escriben en `eventos_administrativos`; borrados y ediciones de grupos, contratos, pasajeros y turismo no dejan rastro (`actorUsername` llega y no se usa).
- `GET /api/google-sheets?sheet=CONFIG` se puede leer sin sesión (`PUBLIC_READ_SHEETS`). Cerrarlo o exponer solo las claves necesarias.
- La base no verifica el certificado de Supabase por defecto (`rejectUnauthorized: false` en `lib/db.js`). Cargar el CA y activar `EAA_POSTGRES_TLS_VERIFY_FULL=true`.
- Los 5 scripts de `cdn.jsdelivr.net` en `index.html` no tienen `integrity` y `swiper@11` no está fijado a una versión exacta.
- La ficha pública crea viajes nuevos desde el texto libre de «destino» (`findOrCreateViaje`). Que solo busque, no cree.

**Paso 4 – Revisar los 12 puntos en el navegador: hecho el 25/11.** Fallas anotadas en `docs/correcciones-del-angel.md` (sección «Revisión a mano»); falta corregirlas.

**Paso 5 – Datos reales (con OK del dueño).**
1. Aplicar las migraciones 0005 y 0006 en Supabase.
2. Importar el Padrón de colegios (ver sección 6): simular primero, `--aplicar` después.
3. Cargar viajes, grupos, contratos y planes de pago. Todo registro lleva `legacy_id` (sin él el admin muestra `id: null`).

**Paso 6 – Correo.** Verificar el dominio en Resend, cargar las tres variables en Hostinger, probar un envío y revisar que la ficha llegue con todos los datos. Corregir el email de contacto del sitio (`contacto@elangelazul.com.ar` no existe). Al arrancar, el servidor reenvía solo 25 correos atrasados por vez (`listFichaEmailsPendientes`).

**Paso 7 – Entrega.** Confirmar el hosting real (README y `render.yaml` dicen Render, comentarios dicen Railway, `admin/README.md` dice Hostinger) y limpiar la documentación. Con OK del dueño: mergear el PR #3, cargar las variables en Hostinger (`EAA_POSTGRES_MIGRATION_ENABLED=true`), rotar `EAA_ADMIN_PASSWORD` y `EAA_AGENTE*_PASSWORD` (la vieja está en el historial público de git).

**Paso 8 – Al final: frontend.** Rediseño visual y detalles (por ejemplo, el resumen del paso 1 de la inscripción aparece duplicado).

**Limpieza menor:** manejador `error` en `fs.createReadStream` de `server.js` (~línea 872); letras fuera de Latin-1 se pierden en el PDF (`textoSeguro`, `lib/ficha-pdf.js`: «Mićić» sale «Mii»); retirar el adaptador de Google Sheets (~150 líneas) cuando la base esté estable.

## 6. Importar el Padrón de colegios
Fuente: «Padrón Oficial de Establecimientos Educativos» en argentina.gob.ar (Ministerio de Educación). Probado con la versión del 07/09/2026: 2.929 establecimientos (1.170 Corrientes, 1.759 Misiones). Entran los comunes con primario o secundario; el CUE queda como `codigo_oficial`.
```bash
node scripts/import-padron-colegios.js padron.xlsx                          # solo lee el archivo
DATABASE_URL=... node scripts/import-padron-colegios.js padron.xlsx         # simula y revierte
DATABASE_URL=... node scripts/import-padron-colegios.js padron.xlsx --aplicar   # guarda (pedir OK)
```
Un colegio cargado a mano con el mismo nombre se vincula; si el nombre ya existe con otro código se agrega la localidad; reimportar no pisa nombres editados ni reactiva bajas. Después de importar, el buscador público recibe ~2.900 colegios sin paginar: probarlo en celular.

## 7. Cómo trabajar (workflow)
1. Una rama por persona o agente; nunca dos en la misma. Salir de `feat/colegios-padron`.
2. Al empezar: `git fetch`, mirar `git log origin/<rama>` y releer la sección 5.
3. Reparto por archivos para no pisarse: servidor y base (`lib/`, `server.js`, `supabase/migrations/`) vs. frontend (`assets/js/app.js`, CSS, HTML).
4. Commits chicos; `npm run check` antes de cada push.
5. Al cerrar la sesión: actualizar este archivo (pasos hechos y lo que sigue) y pushear.
6. Ramas chicas entran a `feat/colegios-padron` por PR; la vista previa de Hostinger sirve para revisar. A `main` solo con OK del dueño.

## 8. Mapa de ramas
| Rama | Qué es |
|---|---|
| `main` | Producción. Último commit 01/10/2026. |
| `feat/colegios-padron` | Trabajo actual (PR #3): suma el importador del Padrón y los documentos de traspaso a `integracion/abc`. |
| `integracion/abc` | Reúne las ramas de noviembre (estabilización de la ficha, Colegios admin, firma en Storage, doble envío, accesibilidad). |
| `feat/ficha-estabilizacion` | Rama A; tiene docs de contexto (`b65f7ef`) que no están en `integracion/abc`. |
| `feat/colegios-admin`, `feat/storage-firma`, `feat/db-doble-envio`, `feat/frontend-pasajeros-a11y` | Ya incluidas en `integracion/abc`. |
| `fix/migracion-supabase-segura`, `feat/ficha-adhesion-v2`, `fix/ficha-v2-release` | Anteriores a noviembre; ignorar. |
