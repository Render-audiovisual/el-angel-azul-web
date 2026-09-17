# Ficha de Adhesión v2 — Diseño

Fecha: 15/09/2026 · Rama: `feat/ficha-adhesion-v2` · Estado: aprobado por Franco en conversación, pendiente de revisión escrita.

## 1. Objetivo

Que la Ficha de Adhesión quede estable, fácil de completar, con validaciones correctas y bien integrada al admin. Cubre los 12 puntos del pedido del cliente:

| # | Pedido | Dónde se resuelve |
|---|---|---|
| 1 | Gestión de colegios, historial, pasajero vinculado | §3, §4.1, §5.1 — Fase 1 (datos) + Fase 2 (admin e importación) |
| 2 | Curso, Grado/Año, División | §3, §4.2 |
| 3 | Nombre y apellido separados | §3, §4.3, §6.1 |
| 4 | Campos obligatorios | §4.4, §3 (constraints) |
| 5 | Tipo de persona PAX / Tutor | §4.1, §4.6 |
| 6 | Datos del tutor (CUIL/CUIT, teléfono, email) | §4.3, §4.4 |
| 7 | Envío de ficha por correo | §6.2 |
| 8 | Plan de pago | §3, §4.3, §5.2 |
| 9 | Dirección | §4.3, §4.4 |
| 10 | Error de carga | §4.5 |
| 11 | Información de pertenencia del PAX en admin | §5.3, §5.4 |
| 12 | Exportación a Excel | §6.3 — Fase 3 |

## 2. Diagnóstico (verificado el 15/09/2026)

- **Error de carga (punto 10), confirmado en vivo:** `bindFichaAdhesion()` guarda la ficha en `localStorage`, dispara `queueGoogleSheetsWrite(["FICHAS_ADHESION"]).catch(() => {})` sin esperar y muestra "Recibimos tu ficha correctamente". En la prueba el servidor respondió **500** y la UI mostró éxito igual. Además cada envío manda **todas** las fichas acumuladas en el dispositivo (9 KB → 38 KB en 4 envíos); con ~100 fichas en un mismo equipo supera `MAX_BODY_BYTES` (1 MB) y falla en silencio.
- **Nombre (punto 3):** el formulario pide "Apellido y nombres" en un campo; `fichaStudentFirstName()` toma la primera palabra como nombre ("Pérez Juan" → nombre "Pérez").
- **Dirección (punto 9):** ningún campo es obligatorio (se aceptó una ficha sin dirección); falta Barrio; Provincia es texto libre; Número y CP abren teclado de letras en el celular. El PDF y el admin muestran bien la dirección (probado con valores largos).
- **PDF:** no imprime Curso/División.
- **Colegios (punto 1):** la tabla `colegios` existe pero no hay UI; la ficha guarda el colegio como texto libre.
- **Dominio:** `elangelazul.com.ar` no existe en DNS, pero el sitio muestra `contacto@elangelazul.com.ar`. Dominio real a confirmar con el cliente.

## 3. Base de datos

La base de Supabase solo tiene datos de prueba: **se reinicia desde cero** (confirmado por Franco). Antes de borrar se revisa el contenido y se avisa. El vaciado de datos de prueba (`truncate` de las tablas con datos) es una operación única, fuera de las migraciones. La nueva migración `supabase/migrations/0003_ficha_adhesion_v2.sql` recrea `inscripciones` y `fichas_adhesion`, crea las tablas nuevas y modifica las existentes. Como no hay datos que preservar, los obligatorios se exigen **también en la base** (`not null` + `check`).

### colegios (se modifica)
- `activo boolean not null default true`
- `provincia text`, `localidad text`
- `codigo_oficial text` (CUE del Padrón) con índice único parcial `where codigo_oficial is not null`

### planes_pago (nueva)
- `id uuid pk`, `contrato_id uuid not null references contratos on delete restrict`
- `nombre text not null`, `cuotas integer not null check (cuotas between 1 and 18)`, `descripcion text`
- `activo boolean not null default true`, `orden integer`, `created_at`, `updated_at` (+ trigger `set_updated_at`)

### inscripciones (se modifica)
- `colegio_id uuid references colegios on delete restrict` (null = eligió "Mi colegio no está")
- `colegio_texto` pasa a ser el nombre escrito por la familia cuando `colegio_id` es null
- `check (colegio_id is not null or length(trim(colegio_texto)) >= 3)`
- `grado text not null`, `division text not null` (reemplazan a `curso_division_texto`); `nivel text not null` = **Curso** (Primaria/Secundaria)
- `plan_pago_id uuid references planes_pago on delete restrict`

### fichas_adhesion (se recrea)
- Pasajero: `pasajero_nombre`, `pasajero_apellido`, `pasajero_tipo_documento`, `pasajero_numero_documento`, `pasajero_nacimiento`, `pasajero_sexo` — todos `not null`.
- Responsable: `responsable_nombre`, `responsable_apellido`, `responsable_tipo_documento`, `responsable_numero_documento`, `responsable_nacimiento`, `responsable_parentesco`, `responsable_cuil_cuit`, `responsable_email`, `responsable_celular` — `not null`; `responsable_telefono` opcional.
- Domicilio: `domicilio_calle`, `domicilio_numero`, `domicilio_localidad`, `domicilio_provincia`, `domicilio_codigo_postal` — `not null`; `domicilio_piso`, `domicilio_departamento`, `domicilio_barrio` opcionales.
- `acepta_condiciones boolean not null check (acepta_condiciones = true)`, `firma_storage_path text not null` (data URL hasta Fase 3).
- Revisión: se mantienen `estado_revision`, `documentacion_estado`, `ficha_medica_estado`, `autorizacion_estado`, `motivo_rechazo`, `aprobado_con_excepcion`, `observaciones` y sus checks.
- Correo: `email_estado text not null default 'pendiente' check (email_estado in ('pendiente','enviado','error','sin_configurar'))`, `email_enviado_at timestamptz`, `email_error text`.

### fichas_tutor (nueva)
- `id uuid pk`
- Pasajero a cargo: `pasajero_nombre`, `pasajero_apellido`, `pasajero_numero_documento` — `not null`
- Tutor: `nombre`, `apellido`, `tipo_documento`, `numero_documento`, `cuil_cuit`, `celular`, `email`, `parentesco` — `not null`
- `acepta_condiciones boolean not null check (acepta_condiciones = true)`
- `estado_revision text not null default 'pendiente' check (estado_revision in ('pendiente','revisada','observada','rechazada'))`, `observaciones`, `created_at`, `updated_at`
- Índice sobre `pasajero_numero_documento`. Se vincula al pasajero por DNI (el pasajero puede no existir aún).

### pasajeros (se modifica)
- `plan_pago_id uuid references planes_pago on delete restrict` (se copia de la ficha al aprobar)

### grupos
Sin cambio de columnas. `grupos.curso` guarda el **Grado/Año** ("5°") y `grupos.division` la división; el nivel viene del viaje. Se documenta en un comentario de la migración.

Todas las tablas nuevas: `enable row level security`, sin policies (deny-by-default, igual que el resto).

## 4. Formulario público

### 4.1 Inicio y paso 1 (selección)
- Pantalla inicial de `/#/inscripcion`: **"¿Quién completa?"** con dos opciones: **Pasajero (PAX)** → flujo completo; **Tutor** → formulario corto (§4.6).
- Paso 1 PAX: Curso (Primaria/Secundaria), destino y año como hoy.
- **Colegio:** buscador sobre `GET /api/public/colegios` (solo activos; devuelve `id, nombre, localidad, provincia`). Última opción **"Mi colegio no está"** → campo de texto (3–120 caracteres).
- **Grado/Año:** select según curso — Primaria 1°–7°, Secundaria 1°–6°. Obligatorio.
- **División:** texto 1–3 caracteres alfanuméricos, se pasa a mayúsculas. Obligatorio.
- Contrato: `GET /api/public/inscripcion-context?colegio_id&nivel&viaje&grado&division` → coincidencia **exacta** (reemplaza el matching difuso por texto). Devuelve `{ contrato: {id, codigo} | null, planes: [{id, nombre, cuotas, descripcion}] }`. Con "Mi colegio no está" no se busca contrato.

### 4.2 Contexto entre pasos
El contexto (curso, destino, año, colegio_id o colegio_texto, grado, división, contrato_id) viaja en los parámetros del hash como hoy.

### 4.3 Paso 2 (ficha PAX)
1. **Pasajero:** Nombre/s, Apellido/s (campos separados) con la aclaración visible *"Escribilos completos, tal como figuran en el DNI y con tildes (ej.: José María / Fernández Núñez)"*; tipo y número de documento; fecha de nacimiento (control de 3 partes existente); sexo.
2. **Tutor responsable:** Nombre/s, Apellido/s, tipo y número de documento, fecha de nacimiento, parentesco (Madre / Padre / Tutor legal / Otro), CUIL/CUIT, email, celular; teléfono alternativo opcional.
3. **Domicilio:** calle, número, piso, departamento, barrio, provincia (select fijo de las 24), localidad (sugerencias de **Georef** filtradas por provincia, texto libre si Georef no responde), código postal. `inputmode="numeric"` en número y CP; en mobile calle y número comparten fila.
4. **Plan de pago:** opciones de los planes activos del contrato. Sin contrato o sin planes → bloque oculto, `plan_pago_id` null ("Pendiente").
5. **Condiciones y firma:** igual que hoy.

### 4.4 Reglas de validación
Un único módulo `assets/js/modules/ficha-validation.js` (UMD: global en el navegador, `require` en Node) usado por el formulario y por `server.js`. Devuelve `{ ok, errores: { campo: mensaje }, sugerencias: { campo: texto } }`.

| Campo | Regla |
|---|---|
| Nombre/s, Apellido/s | 2–80 caracteres; letras (incluye tildes, ñ, ü), espacios, apóstrofo y guion; se recortan espacios dobles |
| Documento | DNI: 7–8 dígitos. Pasaporte: 6–15 alfanuméricos. LC/LE: 6–8 dígitos |
| Nacimiento pasajero | fecha real, edad entre 5 y 25 años |
| Nacimiento tutor | fecha real, edad ≥ 18 |
| Sexo, parentesco | valor de la lista |
| CUIL/CUIT | 11 dígitos, prefijo 20/23/24/27, dígito verificador válido (módulo 11) y, si el tutor usa DNI, los dígitos 3–10 coinciden con su DNI |
| Email | formato válido; sugerencia no bloqueante para dominios mal escritos (gmail.con, gmial.com, hotmial.com, outlok.com, etc.) |
| Celular | 10–13 dígitos luego de quitar símbolos |
| Teléfono alternativo | opcional; si se carga, misma regla |
| Calle | 2–100 caracteres |
| Número | hasta 6 dígitos o "S/N" |
| Piso / Depto / Barrio | opcionales; ≤ 4 / ≤ 6 / ≤ 80 caracteres |
| Provincia | una de las 24 |
| Localidad | 2–80 caracteres |
| Código postal | 4 dígitos o CPA (`A1234ABC`) |
| Grado | dentro del rango del curso |
| División | 1–3 alfanuméricos |
| Colegio | `colegio_id` de un colegio activo, o `colegio_texto` de 3–120 caracteres |
| Plan | obligatorio si el contrato tiene planes activos; el servidor verifica que pertenezca al contrato |
| Condiciones / firma | aceptadas / data URL PNG presente |

Al enviar con errores: resumen arriba con los campos faltantes, mensaje debajo de cada campo, foco y scroll al primero. El servidor repite la validación y responde 400 con `errores` por campo, que el formulario muestra igual.

### 4.5 Envío (corrección del punto 10)
- Nueva ruta `POST /api/public/fichas` con **una** ficha en el cuerpo. Mantiene el rate limit de fichas (50/hora/IP) y la normalización de firma existente.
- Inserción con el esquema actual de `insertFichaPublica`: persona y viaje con upserts atómicos fuera de la transacción; inscripción y ficha dentro de una transacción.
- Respuestas: `201 { ok, id, emailDestino: "m***@gmail.com" }` · `400 { ok: false, errores }` · `429` · `500` con mensaje amable.
- Botón deshabilitado con "Enviando…" durante el pedido. Pantalla de éxito **solo con 201**. En error se mantienen los datos cargados y se muestra el mensaje con opción de reintentar.
- Se elimina el guardado de fichas públicas en `localStorage` y el envío público vía `queueGoogleSheetsWrite`. La rama pública de `FICHAS_ADHESION` en `/api/google-sheets` se elimina.
- Luego de responder 201, el servidor genera el PDF y envía el correo (§6); el resultado se guarda en `email_estado`.
- CSP: se agrega `https://apis.datos.gob.ar` a `connect-src` (Georef permite CORS `*`).

### 4.6 Formulario corto de Tutor
- Pasajero a cargo: nombre/s, apellido/s, DNI.
- Tutor: nombre/s, apellido/s, tipo y número de documento, CUIL/CUIT, celular, email, parentesco, aceptación de condiciones. Sin firma ni domicilio.
- `POST /api/public/fichas-tutor` (mismo rate limit y validación compartida). Sin correo.

## 5. Admin

### 5.1 Colegios (Fase 2)
- Nueva sección `/#/admin/colegios` (y ruta física `admin/colegios/index.html`, como las demás).
- Lista con buscador, filtro Activos/Inactivos y cantidad de grupos y pasajeros. Alta/edición (nombre, provincia, localidad). Activar/desactivar; no hay borrado.
- Lectura/escritura por el contrato existente `/api/google-sheets?sheet=COLEGIOS` con sesión.
- Grupos y Contratos eligen el colegio de esta lista (se deja de crear colegios desde texto libre con `findOrCreateColegio`).
- Importación inicial: script `scripts/import-padron-colegios.js`, se corre una vez, filtra Corrientes y Misiones, upsert por `codigo_oficial`. El formato del Padrón se verifica al empezar la Fase 2.
- **En Fase 1** la lista se carga con unos pocos colegios por SQL para poder probar.

### 5.2 Planes de pago
- Bloque "Planes de pago" en el detalle de cada Contrato: lista, alta (nombre, cuotas 1–18, descripción), desactivar.
- Contrato `/api/google-sheets?sheet=PLANES_PAGO` con sesión.

### 5.3 Bandeja de Fichas
- Columnas: Apellido, Nombre, DNI, Colegio (aviso "Sin vincular"), Grado/División, Plan, Estado, Correo.
- Filtros nuevos: Tipo (PAX / Tutor) y "Colegio sin vincular".
- Detalle, en este orden: **Pertenencia** (Colegio → Curso → Grado/Año → División → Plan → Contrato) · **Pasajero** · **Tutor principal** y **tutores adicionales** (fichas de tutor con el mismo DNI de pasajero) · **Domicilio** · **Firma** · **Correo** (estado, motivo y botón **Reenviar**) · acciones de revisión existentes.
- Colegio sin vincular: selector para asignar un colegio existente o crearlo con el texto escrito.
- Fichas de tutor: etiqueta "Tutor"; el detalle muestra el pasajero vinculado o "Pasajero todavía no registrado".
- Aprobación: además de crear el pasajero (flujo existente), copia `plan_pago_id` y registra el tutor principal y los adicionales en `responsables` + `pasajero_responsables`.

### 5.4 Pasajeros
- Tabla con columnas Colegio, Grado, División, Plan, Tutor.
- Perfil con la cadena de pertenencia y la lista de tutores con contacto.

## 6. PDF, correo y exportación

### 6.1 PDF en el servidor
- `lib/ficha-pdf.js` con **pdf-lib** (JS puro). Fondo: `assets/pdf/ficha-adhesion-template.png`; texto con Helvetica estándar (WinAnsi cubre tildes y ñ), en mayúsculas, con las coordenadas actuales convertidas de 1240×1754 px a A4 (595×842 pt).
- Nombres: `"FERNÁNDEZ NÚÑEZ, JOSÉ MARÍA"`.
- Colegio: `"COLEGIO SAN JOSÉ · SECUNDARIA 5° B"`. Plan en "Forma de pago" y cuotas en su casillero. Barrio agregado a la calle (`"…, Bº LAGUNA SECA"`).
- `GET /api/admin/fichas/:id/pdf` (con sesión) reemplaza la generación en el navegador; se borran `createFichaAdhesionPdfBlob`, `createImagePdfBlob` y sus helpers de `app.js`.

### 6.2 Correo automático (Resend)
- `lib/email.js` con `fetch` a `https://api.resend.com/emails` (sin SDK).
- Para: email del tutor. Copia oculta opcional a `EAA_EMAIL_COPIA`.
- Asunto: `Ficha de adhesión – Fernández Núñez, José María – Bariloche 2027`.
- Cuerpo HTML (con escape de datos): pertenencia, pasajero, tutor, plan; "Queda pendiente de revisión por administración"; contacto de WhatsApp. PDF adjunto en base64.
- Header `Idempotency-Key: ficha-<id>` para no duplicar reintentos.
- Resultado: `enviado` + `email_enviado_at`, o `error` + `email_error` (mensaje legible; 429 → "Límite diario de envíos alcanzado"). Sin variables configuradas → `sin_configurar`. Nunca afecta a la ficha guardada.
- `POST /api/admin/fichas/:id/reenviar-correo` (con sesión) para reintentar.
- Variables: `RESEND_API_KEY`, `EAA_EMAIL_FROM` (`El Ángel Azul <fichas@DOMINIO>`), `EAA_EMAIL_COPIA` (opcional). Requiere dominio verificado en Resend. Plan gratuito: 3.000/mes y 100/día.

### 6.3 Exportar pasajeros a Excel (Fase 3)
- Botón "Exportar a Excel" en Pasajeros; exporta las filas filtradas en pantalla con SheetJS (ya cargado) y `autoFitColumnWidths` existente.
- Columnas: Colegio, Curso, Grado/Año, División, Contrato, Plan, Cuotas, Apellido, Nombre, DNI, Nacimiento, Sexo, Tutor apellido, Tutor nombre, Parentesco, Tutor DNI, CUIL/CUIT, Celular, Email, Calle y número, Barrio, Localidad, Provincia, CP, Estado, Documentación, Ficha médica, Estado de pago.
- Orden: Colegio → Grado → División → Apellido. Archivo `EAA_pasajeros_AAAA-MM-DD.xlsx`.

### 6.4 Supabase Storage (Fase 3)
- Bucket privado `fichas`: firma (PNG) y PDF enviado. `firma_storage_path` pasa a guardar la ruta. El admin descarga a través del servidor.

## 7. Pruebas
- `node --test` (patrón existente en `scripts/*.test.js`):
  - `ficha-validation.test.js`: CUIL válido/inválido y coincidencia con DNI, sugerencia de email, "S/N", CPA, rangos de grado, obligatorios.
  - `ficha-pdf.test.js`: genera un PDF válido (`%PDF`) con texto acentuado sin error.
  - `email.test.js`: `fetch` simulado; header de idempotencia, adjunto, mapeo de 429 y de falta de configuración.
  - `server-routes.test.js`: `POST /api/public/fichas` rechaza fichas incompletas con `errores`; la rama pública vieja ya no existe.
- Prueba de punta a punta con Playwright contra la base reiniciada: envío PAX y Tutor, errores de validación, pantalla de éxito solo con 201, detalle en admin, PDF. Se borran los datos de prueba al terminar.

## 8. Fases
1. **Fase 1:** migración 0003 y reinicio de base, validación compartida, formulario PAX y Tutor, ruta de envío, admin de Fichas y Pasajeros (pertenencia y planes por contrato), PDF en servidor, correo con Resend, Georef.
2. **Fase 2:** sección Colegios e importación del Padrón.
3. **Fase 3:** exportación a Excel y Supabase Storage.

## 9. Pendientes externos (no bloquean el desarrollo)
- **Dominio `elangelazul.tur.ar`** (verificado en RDAP de NIC.ar el 15/09/2026): activo, vence 05/02/2027, delegado desde 2017 a nameservers de AWS Route 53 que **rechazan las consultas** (no hay zona activa). Hoy no resuelve web ni correo. Primero hay que definir el proveedor de DNS (recuperar la cuenta de AWS o delegar a uno propio, p. ej. Cloudflare) y, en esa misma sesión, cargar los registros de Render (web) y de Resend (correo). Cambiar de proveedor de DNS después obligaría a rehacer ambos.
- Hasta entonces el sitio sigue en el subdominio de Render y el correo queda **implementado pero inactivo** (`email_estado = 'sin_configurar'`); activarlo es cargar `RESEND_API_KEY`, `EAA_EMAIL_FROM` y `EAA_EMAIL_COPIA` en Render, sin cambios de código.
- Corregir el email de contacto del sitio: `contacto@elangelazul.com.ar` no existe (ese dominio no está registrado).
- Cuenta de Resend y verificación DNS del dominio.
- Definir los planes reales por contrato (se prueba con el cliente y se ajusta).

## 10. Fuera de alcance
- Correo para fichas de tutor.
- Notificaciones por WhatsApp (API de Meta).
- Consulta al padrón de AFIP.
- Partir `app.js` en módulos (solo se agrega el módulo de validación).
