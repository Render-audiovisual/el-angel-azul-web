# Traspaso del proyecto – El Ángel Azul (24/11/2026)

Escrito para el programador que sigue el trabajo (con Codex, Claude Code u otro agente). Primero `AGENTS.md` (reglas, checklist de sesión y qué puede hacer un agente). Después leé este archivo entero, `docs/ARQUITECTURA.md`, y seguí desde el primer paso pendiente de la sección 5.

## En curso
Una fila por persona o agente. Cada uno edita solo su fila al empezar y al cerrar la sesión.

| Quién | Rama | Paso | Archivos que toca | Actualizado |
|---|---|---|---|---|
| Fran (Claude Code) | `fran/harness` | Harness: guardas, `AGENTS.md`, docs | `AGENTS.md`, `CLAUDE.md`, `package.json`, `scripts/guardas.test.js`, `scripts/helpers/sin-secretos.js`, docs | 25/11 |
| Fran (Claude Code) | `fran/inicio-hallmark` | Paso 8: rediseño del inicio con la skill Hallmark (el PR #8 de Agustín quedó integrado, con su OK) | `index.html`, `assets/css/home.css`, `assets/css/public-experience.css`, `assets/js/modules/home-motion.js`, `renderHome` en `assets/js/app.js` | 27/11 |
| Agustín (Codex) | `agustin/integracion-franco-hostinger` | Versión de Franco integrada con admin independiente; check: 162 pasan, 2 TODO conocidos (roles/TLS), 0 fallos. Preparada para vista previa de Hostinger por pedido del dueño | `index.html`, `assets/js/app.js`, `assets/css/styles.css`, `admin/index.html`, `server.js`, pruebas de rutas y frontend, este documento | 27/11 |

## Harness (25/11/2026)
- Las reglas del repo ahora se chequean en `npm run check` con `scripts/guardas.test.js`: secretos en archivos del repo, `.env` trackeados, docs con referencias rotas y `CLAUDE.md` → `AGENTS.md`.
- `npm test` carga `scripts/helpers/sin-secretos.js`: borra `DATABASE_URL`, claves de Supabase y Resend y contraseñas antes de cada test.
- La deuda del Paso 3 figura como `todo` en la salida del check. Quien la resuelve le saca el `todo`.

## Integración de Codex (24/11/2026)

- Se integró el traspaso `0c9d626` con el commit local `1c3bde0`: confirmación de correo pendiente y prueba HTTP completa de inscripción. Base integrada: 117 pruebas. Guardado concurrente terminado: 130 pruebas aprobadas.
- Hostinger fue verificado como hosting el 17/11. Se creó una previsualización independiente sin base conectada (`devoted-sienna-fox-25.hostingersite.com`), además de la vista previa automática del PR #3. No se modificó `main`.
- Se trabaja en `fix/admin-guardado-concurrente`, sin escrituras en la base real.

## Página pública (25/11/2026)

- 27/11: login simplificado a pedido del dueño: una tarjeta con logo, Bebas Neue/Poppins y paleta de la web. CSS propio en `assets/css/admin-login.css`, sin cambiar tablas del admin. Comprobados ingreso, cierre de sesión y mostrar contraseña en local, y 390 × 844 sin desborde. Check: 162 pasan, 2 TODO conocidos, 0 fallos. Base de pruebas de Supabase aún pendiente de creación; no se conectó Hostinger a una base real.

- 27/11: el dueño pidió retirar «Acceso interno» de la web pública. Eliminado del footer y la navegación; acceso independiente en `/admin/`, con login y `noindex`. Los enlaces hash antiguos del admin redirigen a esa entrada. Los endpoints privados mantienen la sesión obligatoria. Repositorio transferido a `el-angel-azul/el-angel-azul-web`; `frannook` tiene rol Admin en GitHub.

- Propuesta pedida por el dueño con referencia Maxdream en `feat/publica-experiencia`, basada en `fix/admin-guardado-concurrente`. Dirección y validación en `docs/DISENO-PUBLICO.md`.
- Portada nueva y navegación/footer públicos; `assets/css/public-experience.css` separa los estilos del admin y los formularios. Fotografías propias existentes, destinos, galería, preguntas frecuentes y accesos a consulta e inscripción.
- 130 pruebas aprobadas, revisión de escritorio/móvil y rutas públicas. Sin cambios en `main`, Supabase real ni el despliegue compartido.

## 1. Qué es y dónde está
- Web de viajes estudiantiles: sitio público, ficha de adhesión online (PAX y Tutor) y panel de administración. Node sin framework (`server.js`) + una SPA en `assets/js/app.js` (~9.500 líneas: **no la leas entera**, usá `grep -n` y leé el rango). Datos en Postgres (Supabase).
- Repo: https://github.com/Render-audiovisual/el-angel-azul-web (privado: pedí acceso a la organización).
- **Rama de trabajo: `feat/colegios-padron`**. Está abierto el PR #3 hacia `main` (no mergear sin OK del dueño). Hostinger arma una vista previa por cada push: https://hushed-teal-stingray-74.hostingersite.com (no verificado a qué base apunta; confirmalo antes de usarla con datos).
- **Nada está desplegado todavía.** Todo se trabajó en local.
- Lo escrito antes de noviembre de 2026 está desactualizado (`contexto proyecto/*` habla de Railway). Vigentes: `AGENTS.md`, este archivo, `docs/ARQUITECTURA.md`, `docs/correcciones-del-angel.md` y `docs/CONSIGNAS-CLIENTE.md`. Referencia histórica: `docs/superpowers/plans/2026-11-10-plan-mejora-angel-azul.md`.

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
npm run check     # tests y guardas, sin red ni base real (usa PGlite en memoria)
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
**Depende de configuración externa:** correo (Resend) apagado: faltan `RESEND_API_KEY`, `EAA_EMAIL_FROM`, `EAA_EMAIL_COPIA` y el DNS de `elangelazul.tur.ar` (la delegación a AWS está muerta). La base real está casi vacía (0 planes, 0 contratos, 0 inscripciones). Las migraciones 0005 y 0006 se aplicaron el 26/11.

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

**Paso 2 – IP del visitante en Hostinger: código listo (26/11), falta medir en Hostinger.** `clientIp` (`server.js`) cuenta desde la derecha de `X-Forwarded-For` y ahora la cantidad de proxies es configurable con `EAA_PROXY_HOPS` (por defecto 1, igual que antes). Si Hostinger suma un proxy más, todos los visitantes comparten IP: 50 fichas por hora para todo el sitio y 5 contraseñas malas bloquean el login de todos. No hay documentación de Hostinger que confirme cuántos saltos hay; hay que medirlo en el servidor real:
1. Con la rama desplegada (vista previa o producción) y `EAA_ADMIN_PASSWORD` cargada, entrá al admin como `admin` (los agentes no ven el diagnóstico).
2. Abrí `/api/admin/diagnostico-ip` en el mismo navegador. Compará `ipCalculada` con tu IP pública (por ejemplo, la que muestra ifconfig.me).
3. Repetilo desde otra red (datos del celular). Tienen que dar IP distintas, cada una la tuya.
4. Si `ipCalculada` es la misma en las dos redes o no es la tuya: mirá `xForwardedFor`. Si tu IP aparece una posición antes del final, cargá `EAA_PROXY_HOPS=2` (o el número que corresponda, hasta 5) en Hostinger y repetí.
5. Si `xForwardedFor` viene vacío, el hosting no manda el encabezado: avisá antes de seguir, porque hace falta otra fuente (por ejemplo `xRealIp`).

**Paso 3 – Seguridad del servidor (parcial, 26/11).**
- **Hecho:**
  - `GET /api/google-sheets?sheet=CONFIG` ya no se lee sin sesión (y la pantalla Configuración, que ya era solo admin, ahora también lo es en el servidor: 403 para agencia).
  - Los 7 scripts y estilos de `cdn.jsdelivr.net` llevan `integrity` y versión exacta (`swiper@11.2.10`, mismo contenido que servía `swiper@11`). Hashes calculados bajando los archivos de jsDelivr el 26/11: si cambia una versión, hay que recalcularlos.
  - La ficha pública solo **busca** el viaje (`findViaje`); si el destino y año no están cargados, responde 400 «Ese viaje todavía no está habilitado…» y no crea ni viaje ni persona. **Antes de abrir inscripciones hay que cargar los viajes** (Paso 5).
  - Auditoría: crear, editar y eliminar en Grupos, Contratos, Pasajeros, Turismo, Tutores, Planes y Colegios escriben en `eventos_administrativos` (usuario, entidad, id y nombres de los campos cambiados, sin valores), en la misma transacción del guardado. Las fichas ya se auditaban.
  - `server.js`: el stream de archivos estáticos tiene manejador de error (antes un error de lectura tiraba el proceso).
  - Aviso en el log al arrancar en producción si el certificado de la base no se verifica.
- **Falta (necesita tu decisión o configuración):**
  - **Roles:** hoy solo Configuración es exclusiva del admin. Un agente (rol `agencia`) puede borrar grupos, contratos, colegios y viajes con la API. Hay que definir la matriz de permisos y chequearla en el servidor con un test (propuesta en el PR #11).
  - **Certificado de Supabase:** cargar `SUPABASE_DB_CA_CERT` (CA descargado del panel de Supabase) y `EAA_POSTGRES_TLS_VERIFY_FULL=true` en Hostinger. Es configuración, no código; hasta entonces `lib/db.js` conserva `rejectUnauthorized: false` por defecto.

**Paso 4 – Revisar los 12 puntos en el navegador: hecho el 25/11.** Fallas anotadas en `docs/correcciones-del-angel.md` (sección «Revisión a mano»); falta corregirlas.

**Paso 5 – Datos reales (con OK del dueño).**
1. ~~Aplicar las migraciones 0005 y 0006 en Supabase.~~ Hecho el 26/11/2026 con OK del dueño: bucket `fichas` e índices `inscripciones_vigente_uk` y `fichas_tutor_vigente_uk` verificados, sin duplicados previos.
2. **Padrón de colegios (estado 27/11/2026).** Archivo del 07/09/2026 bajado de argentina.gob.ar (SHA-256 `f2949f0e…ef8799`): 2.929 establecimientos. Simulado en local con PGlite: 2.929 nuevos, 8 renombrados por nombre repetido, repetible, menos de 1 s; la lista pública pesaría ~400 KB (112 KB con gzip). En producción había 2 colegios cargados a mano, de prueba (Colegio San José y Escuela Normal Dr. Juan Pujol): desactivados el 27/11 con OK del dueño. **Falta** que el dueño corra la simulación y después `--aplicar` con su `DATABASE_URL` (ver sección 6) y probar el buscador con ~2.900 colegios en Safari/iPhone.
3. **Viajes: PENDIENTE, lo arma el dueño con la agencia.** En producción no hay ningún viaje estudiantil, así que la ficha no se puede enviar. Los 3 viajes que había eran de turismo y de prueba (`demo-bariloche`, `demo-brasil` y un borrador vacío): inactivos desde el 27/11. Hace falta la lista de viajes a abrir (nivel, destino con año, fechas) y un OK antes de insertar. La ficha los busca por nivel y destino con año (ej. `Secundaria` + `Bariloche 2027`); destinos que ofrece la web: Primaria, Carlos Paz; Secundaria, Bariloche, Carlos Paz y Camboriú.
5. **Migración 0007 (índices de claves foráneas): aplicada el 27/11/2026 con OK del dueño; los 8 índices están en Supabase.** Cubre las 8 claves sin índice que marcó el advisor de Supabase el 27/11 (`inscripciones`, `pasajeros`, `eventos_administrativos`); `scripts/indices-fk.test.js` falla si alguna clave nueva queda sin índice. Los 26 índices «sin uso» del advisor son normales con la base vacía: no se tocan.
   - **Turismo público (27/11):** la web ya no cae a viajes de demostración (`assets/data/turismo-paquetes.json` traía «Bariloche $890.000» y «Brasil $1.250.000»). Lo que devuelve la base es lo que se publica; sin viajes activos muestra «Estamos preparando nuestros próximos viajes». Los viajes de Turismo los carga el dueño desde el admin.
4. **Grupos, contratos y planes de pago: pendiente**, con datos reales de la agencia (no inventar precios ni condiciones). Todo registro lleva `legacy_id` (sin él el admin muestra `id: null`). Hoy hay 0 grupos, 0 contratos y 0 planes.

**Paso 6 – Correo.** Verificar el dominio en Resend, cargar las tres variables en Hostinger, probar un envío y revisar que la ficha llegue con todos los datos. El footer ya no muestra el mail de contacto (`contacto@elangelazul.com.ar` no existe): cuando haya un mail oficial, volver a ponerlo en `index.html`. Al arrancar, el servidor reenvía solo 25 correos atrasados por vez (`listFichaEmailsPendientes`).

**Paso 7 – Entrega.** Hosting real: Hostinger (confirmado por el dueño). El 26/11 se cambiaron README, comentarios y mensajes que decían Render o Railway. Queda `render.yaml`: es de un servicio Render que quizás sigue conectado al repo; borrarlo solo con OK del dueño. Con OK del dueño: mergear el PR #3, cargar las variables en Hostinger (`EAA_POSTGRES_MIGRATION_ENABLED=true`), rotar `EAA_ADMIN_PASSWORD` y `EAA_AGENTE*_PASSWORD` (la vieja está en el historial público de git).

**Paso 8 – Al final: frontend.** La portada pública la rediseña el PR #8 (Agustín): no tocarla desde acá. Acordado con el dueño (26/11): solo detalles de accesibilidad y uso en admin y ficha, en PRs chicos.
- [x] Resumen de la inscripción duplicado en el segundo tramo (se oculta «Tu inscripción»; test en `scripts/frontend-regression.test.js`).
- [x] Contraste: la etiqueta «Admin» estaba en 2:1 (texto oscuro sobre azul), ahora 8,3:1; los placeholders ya pasaban (4,75:1 en el login del admin, 5,2:1 en la ficha) y se oscurecieron para dejar margen.
- [x] Admin en celular (390 px): Colegios se cortaba a la derecha (panel de 514 px en 355). Corregido con columnas `minmax(0, 1fr)` y `min-width: 0` en `.admin-main`, `.admin-turismo-panel` y los `fieldset` y `select` del formulario. Las tablas (920 a 2200 px de ancho) ya se desplazaban dentro de su contenedor y no cambiaron; si se prefieren tarjetas en vez de scroll lateral, es decisión de diseño del dueño. Queda un botón de Pasajeros que se pasa 12 px en escritorio (1280 px), ya existía.
- [x] Botón «Limpiar firma»: 34 px → 44 px (`min-height`). Era el único control de la ficha por debajo de 44 px en celular.
- [x] Teclado en la ficha (26/11): Domicilio, Condiciones y Firma tenían `visibility:hidden` hasta un scroll real (GSAP `autoAlpha`), así que con Tab se saltaban y no se podía completar ni enviar la ficha. Ahora el reveal anima solo `opacity` y el foco muestra el bloque. Probado con Tab en el navegador: se alcanzan todos los campos, la firma por texto, «Limpiar firma» y «Enviar ficha», con y sin «reducir movimiento».
- [x] Portada: rediseñada con Hallmark (27/11), sin `autoAlpha`; el movimiento nuevo (`home-motion.js`) no saca nada del orden de Tab. Pendiente el mismo patrón en encabezados y tarjetas de Turismo público (se rediseña a continuación). Falta probar con un lector de pantalla real (VoiceOver).

**Hecho el 26/11:** el PDF transliteró «Mićić» → «Micic» (`textoSeguro`, `lib/ficha-pdf.js`; lo exacto pide embeber una fuente con fontkit, dependencia nueva). Un 401 al guardar en el admin recarga y el login avisa que el cambio no se guardó.

**Limpieza menor:** manejador `error` en `fs.createReadStream` de `server.js` (~línea 872); retirar el adaptador de Google Sheets (~150 líneas) cuando la base esté estable.

## 6. Importar el Padrón de colegios
Fuente: «Padrón Oficial de Establecimientos Educativos» en argentina.gob.ar (Ministerio de Educación). Probado con la versión del 07/09/2026: 2.929 establecimientos (1.170 Corrientes, 1.759 Misiones). Entran los comunes con primario o secundario; el CUE queda como `codigo_oficial`.
```bash
node scripts/import-padron-colegios.js padron.xlsx                          # solo lee el archivo
DATABASE_URL=... node scripts/import-padron-colegios.js padron.xlsx         # simula y revierte
DATABASE_URL=... node scripts/import-padron-colegios.js padron.xlsx --aplicar   # guarda (pedir OK)
```
Un colegio cargado a mano con el mismo nombre se vincula; si el nombre ya existe con otro código se agrega la localidad; reimportar no pisa nombres editados ni reactiva bajas. Después de importar, el buscador público recibe ~2.900 colegios sin paginar: probarlo en celular.

## 7. Cómo trabajar (workflow)
Ramas, reparto, checklist de inicio y cierre y qué puede hacer un agente: ver `AGENTS.md`. Al cerrar la sesión, actualizá tu fila de «En curso» (arriba) y los pasos de la sección 5. La vista previa de Hostinger sirve para revisar los PR.

## 8. Mapa de ramas
| Rama | Qué es |
|---|---|
| `main` | Producción. Último commit 01/10/2026. |
| `feat/colegios-padron` | Trabajo actual (PR #3): suma el importador del Padrón y los documentos de traspaso a `integracion/abc`. |
| `integracion/abc` | Reúne las ramas de noviembre (estabilización de la ficha, Colegios admin, firma en Storage, doble envío, accesibilidad). |
| `feat/ficha-estabilizacion` | Rama A; tiene docs de contexto (`b65f7ef`) que no están en `integracion/abc`. |
| `feat/colegios-admin`, `feat/storage-firma`, `feat/db-doble-envio`, `feat/frontend-pasajeros-a11y` | Ya incluidas en `integracion/abc`. |
| `fix/migracion-supabase-segura`, `feat/ficha-adhesion-v2`, `fix/ficha-v2-release` | Anteriores a noviembre; ignorar. |

## Inicio rediseñado con Hallmark (27/11/2026)
- **Marca intacta:** paleta (`#083b7a`, `#0d69a1`, rosa de botones `#c42774` para contraste 5,2:1 con texto claro, fondo `#f7fbfe`) y tipografía (Bebas Neue en titulares, Poppins en textos), como pidió el dueño.
- **Estructura (8 secciones):** hero con dos entradas (viajes estudiantiles y turismo), destinos (Bariloche, Carlos Paz y Camboriú para egresados), «Vos vivís el viaje» (tramo fijo con tres fotos), Turismo, momentos reales, cómo te inscribís, preguntas y cierre. Se quitó la franja de tres afirmaciones y el pedido de contacto duplicado.
- **Turismo en el inicio:** muestra hasta 3 viajes **activos de la base** (`loadTurismoPublicPackages`); sin viajes activos no inventa ninguno y deja la invitación a consultar.
- **Fotos del dueño:** `homePhotos` en `renderHome` (`assets/js/app.js`) tiene dos huecos, `camboriu` y `turismo`. Subí la foto (por ejemplo `assets/img/home/camboriu.webp`, ~1600×2100 vertical para Camboriú y ~1600×1280 para Turismo) y poné la ruta; mientras tanto se ven como paneles de la marca. La biblioteca de Hallmark no tenía fotos de Camboriú ni de viajes familiares. Las fotos actuales del inicio son las reales de los grupos.
- **Movimiento:** Lenis afinado (más inercia, anclas con Lenis), titulares que suben palabra por palabra, parallax suave en las fotos y tramo fijo con cambio de foto. Todo es visible sin JS; con «reducir movimiento» no hay tramo fijo ni scroll suave. Cargado desde `assets/js/modules/home-motion.js`.
- **Hallmark:** `sloplint --render` sobre `home.css` y `public-experience.css`: 0 FAIL, 0 REFLEX (un hallazgo, las fotos vacías, queda justificado en el sello). Falta la revisión final en contexto limpio y mirarlo en Safari/iPhone reales.
