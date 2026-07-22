# Plan de migración a base de datos real (Supabase/PostgreSQL) — v5

**Estado: auditoría completa desde cero (20/07/2026) + revisión Wilson incorporada en v4.1 + segunda pasada de revisión cruzada en v5. Cero código real tocado. Cero datos migrados todavía. Lista para que Wilson la revise una vez más y arranque la planificación de backend.**

Esta versión reemplaza a la v4.1. Wilson corrigió tres cosas reales sobre la v4 (IDs legacy para compatibilidad, `codigo_contrato` menos frágil, aclaración de que la service role bypassea RLS) — las tres quedan incorporadas. Esta v5 hace una segunda pasada crítica sobre esas correcciones (releyendo `app.js` de nuevo, no solo el documento) y encontró que una de ellas estaba bien dirigida pero explicada de forma que subestima el problema real, y ajusta el texto y una regla de `lib/db.js` en consecuencia. El DDL de Wilson no tenía errores de sintaxis ni regresiones — los cambios de v5 son de **alcance y precisión del comportamiento**, no de estructura de tablas.

**Qué cambió respecto a v4.1** (detalle completo en las secciones correspondientes):
- El mecanismo de `legacy_id` no es solo para el backfill inicial — es **infraestructura permanente**, porque `app.js` sigue generando sus propios IDs client-side (grupos, contratos, paquetes de Turismo) para siempre, mientras no se toque esa parte del frontend. Se corrigió la regla de lectura en `lib/db.js` que estaba mal enunciada para este caso.
- Se agregó una regla documentada para `contratos` (mismo patrón que ya existía para `viajes.slug`): un contrato `activo` debería tener `codigo_contrato` cargado, aunque la columna sea nullable a nivel DB.
- Se aclaró que `responsables_doc_uk` no es un cambio de comportamiento respecto a v4 (Postgres ya trata NULL como distinto en un unique multi-columna por default) — se deja como está por claridad de lectura, no porque hubiera un bug.
- Nota nueva para `pasajeros`: además de `legacy_id`, `lib/db.js` puede resolver identidad real vía `persona.numero_documento + viaje_id` (el natural key real), tratando `legacy_id` ahí más como respaldo de auditoría que como necesidad estructural (a diferencia de grupos/contratos/viajes, donde sí es estructural).

---

## 1. Diagnóstico del código actual

### 1.1 Arquitectura real (verificada, no supuesta)

- **Un solo backend** (`server.js`, 638 líneas, Node puro sin dependencias — `package.json` tiene `"dependencies": {}`). Sirve archivos estáticos, autenticación de admin por cookie de sesión en memoria, y un único endpoint de datos: `GET/POST /api/google-sheets?sheet=NOMBRE`.
- **Google Sheets es la única base de datos real hoy.** El "esquema" verdadero no es un documento de diseño — es el objeto `SCHEMA` en `server.js:140-149`, siete hojas: `GRUPOS`, `CONTRATOS`, `PASAJEROS`, `FICHAS_ADHESION`, `PAGOS`, `CUOTAS`, `TURISMO`, `CONFIG`. Cada hoja es una tabla plana de texto (sin tipos, sin FKs, sin constraints — Sheets no los tiene).
- **El frontend nunca habla con Sheets directo.** Todo pasa por `fetchGoogleSheetRows`/`writeGoogleSheetRows` en `assets/js/modules/persistence.js`, que a su vez llaman a `/api/google-sheets`. Este endpoint ya es exactamente el patrón de "proxy server-side con service role" que se planeaba para Supabase — la migración reemplaza el interior de `handleSheets()`, no la forma en que el frontend lo consume.
- **`ElAngelAzulPersistence.providers`** ya declara placeholders `supabase`/`firebase` con solo un `status` de texto — no hay ninguna integración real todavía, son etiquetas de UI en la pantalla de Configuración del admin.
- **Importante para todo lo que sigue en la sección de IDs (riesgo #10): `POST /api/google-sheets` nunca devuelve el cuerpo de la fila guardada.** `handleSheets()` responde `{ ok: true, sheet }` — nada más. El cliente jamás se entera de un ID generado server-side. Esto es lo que obliga a que grupos, contratos y viajes tengan hoy su ID generado 100% client-side (ver 1.2).

### 1.2 Cómo se modelan hoy los datos (esto es lo que cambió respecto a lo que asumía la v3)

**Grupos y pasajeros no son colecciones separadas en memoria — son un árbol anidado.** `adminPasajerosDemo` es un array de **grupos**, y cada grupo tiene un array `pasajeros` adentro (`app.js:2906-2934`, `sheetGroupFromRow`/`sheetPassengerFromRow` en `2992-3024`). El nombre de la variable es engañoso: no es "los pasajeros", es "los grupos, con sus pasajeros anidados". Al sincronizar con Sheets, se reconstruye ese árbol a partir de dos hojas planas (`GRUPOS` + `PASAJEROS` unidas por `grupo_id`, `applyGoogleSheetsRows` en `3057-3076`).

**No existe una tabla/hoja de colegios.** `colegio_id` en `CONTRATOS` **no es un ID real ni persistente** — se deriva client-side al vuelo con `adminColegioId()` (`app.js:2237-2239`): `colegio-${slug(nombre)}`. Es decir, hoy "colegio" es solo texto libre (`colegio` en `GRUPOS`, `colegio_nombre` en `CONTRATOS`), sin catálogo real. Cualquier variación de tipeo ("Colegio San Martín" vs "Colegio San Martin ") crea entidades distintas en la práctica.

**No existe un catálogo de viajes unificado.** Lo que hoy se llama "viaje" en `GRUPOS`/`CONTRATOS`/`PASAJEROS`/`FICHAS_ADHESION` es **texto libre** (`"Bariloche 2026"`), nunca un ID. Turismo, en cambio, vive en una hoja completamente aparte (`TURISMO`) con su propio `id`/`slug`, sin ninguna relación con `GRUPOS`/`CONTRATOS`. Hoy son **dos sistemas separados que no se tocan**: Estudiantil (Grupos→Contratos→Pasajeros→Fichas) y Turismo (catálogo de paquetes con CTA de WhatsApp, sin inscripción digital ni pasajeros vinculados).

**Tres entidades generan su propio ID en el navegador, con fórmulas deterministas y no-UUID — esto es estructural, no un detalle de implementación:**
- **Grupos**: `groupId(nivel, viaje, colegio, curso, division)` = slug de esos cinco campos (`assets/js/modules/groups.js:11-13`).
- **Contratos**: `adminContratoId(group)` = `` `contrato-${group.id}` `` (`app.js:2241-2243`).
- **Paquetes de Turismo (alta nueva)**: `id = adminTurismoEditingId || \`viaje-${Date.now()}\`` (`app.js:6560`).

Como el servidor nunca devuelve el cuerpo de la fila escrita (ver 1.1), el navegador es la única fuente de verdad de estos tres IDs, y como nadie va a reescribir estas partes de `app.js` en esta migración, **esto sigue pasando para siempre después del corte a Supabase**, no solo durante el backfill de datos históricos. Ver riesgo #10 y sección 4/5 para el tratamiento.

**El emparejamiento de colegio en Inscripción pública es difuso a propósito, no por ID.** `resolveInscripcionContract()` (`app.js:2385-2416`) usa distancia de Levenshtein normalizada (`schoolSimilarityScore`) sobre el nombre de colegio tipeado por la familia contra `colegio_nombre` de los contratos activos, filtrando primero por nivel+viaje+curso/división exactos. Esto es una función real de negocio (tolera errores de tipeo/mayúsculas) que **hay que preservar como lógica de aplicación**, no reemplazar por un `<select>` rígido de colegio_id — si se migra a FKs duros sin mantener este matching difuso server-side, se rompe la búsqueda de contrato para cualquier familia que no tipee el nombre exacto.

**El dropdown de destino/año en Inscripción pública es fijo en código, no viene de datos reales.** `inscripcionDestinosPorNivel`/`inscripcionAnios` (`app.js:7249-7253`) son constantes hardcodeadas. Si el admin carga un grupo nuevo para "Bariloche 2029", el formulario público no lo va a ofrecer como opción hasta que alguien edite `app.js`. No es un bug que haya que arreglar en esta migración (es un gap de UX/producto, fuera de alcance de "no tocar UI"), pero **si en algún momento se decide exponer un catálogo real de viajes al público, este es el punto de enganche** — se anota como mejora futura, no se resuelve ahora.

**La ficha de adhesión pública recolecta mucha más data de la que persiste hoy.** El objeto `ficha` que arma el frontend (usado para generar el PDF, `renderFichaPdf` ~línea 3979-4115) incluye `pasajeroTipoDocumento`, `responsableTipoDocumento`, `domicilioCalle/Numero/Piso/Departamento/Localidad/Provincia/Telefono/Celular/CodigoPostal`, y **una firma** (`ficha.firma`, usada con `loadPdfImage()` para estampar el PDF). Ninguno de estos campos existe en `SCHEMA.FICHAS_ADHESION` de `server.js` (que solo tiene `pasajero_dni`, `pasajero_nombre`, `responsable_nombre`, `responsable_telefono` y los campos de estado/asignación). **Conclusión importante: hoy esos datos (domicilio completo, tipo de documento, firma) nunca llegan al servidor — viven solo en el navegador que llenó el formulario, se usan para el PDF al vuelo, y se pierden.** Migrar a Supabase con el esquema de fichas completo no es solo "cambiar de base de datos" — es la primera vez que esta información se guarda de verdad server-side. Hay que tratarlo como una funcionalidad nueva que agregar al POST público de fichas, no como una migración de datos existentes (no hay domicilios/firmas reales que migrar, porque nunca se guardaron).

**A diferencia de grupos/contratos/turismo, el `id` de ficha de adhesión SÍ lo genera el servidor hoy** (`` `ficha-${Date.now()}-${hex}` `` en el branch público de `handleSheets()`), nunca el navegador. Esto importa para la regla de lectura de `lib/db.js` (sección 5.3): para `fichas_adhesion`, después de la migración es seguro devolver el UUID real de Postgres en vez de preservar el formato viejo, porque no hay ningún cliente que dependa de ese formato específico — solo hace falta `legacy_id` para el backfill de filas históricas (auditoría de "qué fila vieja se convirtió en cuál nueva"), no como mecanismo permanente.

**No existe ningún mecanismo de carga de documentos (DNI, ficha médica, comprobante) hoy.** Se buscó explícitamente (`type="file"`, `FileReader`, subida de adjuntos) y no hay nada — `documentacion_estado`/`ficha_medica_estado` son etiquetas manuales que el admin cambia a mano ("Pendiente"/"Completa"/"Observada"), sin ningún archivo real detrás. La tabla `documentos` + Storage es **100% funcionalidad nueva**, no tiene datos legacy que migrar.

**PAGOS/CUOTAS están definidas en el esquema pero no se pueden escribir.** `WRITE_ALLOWED` en `server.js:151` no incluye `PAGOS` ni `CUOTAS` — confirma lo que ya se sabía (memoria de deuda técnica): el admin de Pagos/Cuotas nunca tuvo sincronización real, son datos parcialmente locales. Se mantiene la decisión ya tomada de dejarlas como módulo futuro (`0002_pagos_futuro.sql`), sin tocar ahora.

**El DNI es la clave de identidad real, pero solo se valida en JavaScript, nunca en el storage.** La hoja `PASAJEROS` no tiene ningún constraint de unicidad (Sheets no puede tenerlo); la unicidad global de DNI la hace `app.js` a mano recorriendo `adminPasajerosDemo` completo antes de crear/editar (fix del 17/07). Esto es exactamente lo que un `unique` real en Postgres resuelve de raíz. **Nota adicional de esta pasada: el objeto de pasajero en memoria (`sheetPassengerFromRow`) ni siquiera carga un campo `id` — la identidad real que usa el admin siempre es el DNI.** El `id` de fila (`` `pasajero-${dni}` ``) se calcula solo al momento de escribir a la hoja (`googleSheetsPassengerRows`), recién derivado del DNI. Esto significa que para `pasajeros`, `lib/db.js` puede (y conviene que) resuelva identidad real vía `persona.numero_documento + viaje_id` en vez de confiar ciegamente en el `id` que manda el cliente — `legacy_id` en `pasajeros` queda entonces más como respaldo de auditoría del backfill que como necesidad estructural (a diferencia de grupos/contratos/viajes, donde sí lo es porque ahí el `id` es la única clave que el cliente conoce y reutiliza).

**La aprobación de ficha → creación de pasajero no es atómica.** En el handler de aprobación (`app.js` ~3706-3756): primero `saveAdminPasajerosDemo()` (escribe GRUPOS+PASAJEROS a Sheets), después, en un paso separado, `await saveFichasAdhesionDemo(...)` (escribe FICHAS_ADHESION). Son dos escrituras HTTP independientes a Sheets. Si la segunda falla (red, cuota de API, etc.), queda un pasajero real creado pero la ficha sigue en estado `pendiente` — inconsistencia silenciosa. Esto es exactamente el tipo de problema que una transacción real de Postgres resuelve gratis.

### 1.3 Seguridad (ya auditada en rondas previas, confirmada vigente al releer el código)

- `PASAJEROS`/`FICHAS_ADHESION`/`PAGOS`/`CUOTAS` requieren sesión de admin para lectura; `GRUPOS`/`CONTRATOS`/`TURISMO`/`CONFIG` son públicas (necesario para que Inscripción pública busque contrato sin login).
- Solo `FICHAS_ADHESION` admite escritura pública, con: 1 fila por request, `id` generado server-side (`crypto.randomBytes`), validación mínima (`validPublicFicha`), rate limit 10/hora/IP.
- Rate limiting genérico por IP+path (240/15min), rate limit de login (5/15min), cookies `HttpOnly`+`SameSite=Lax`+`Secure` condicional a HTTPS, chequeo de same-origin en métodos de escritura, headers de seguridad (`X-Frame-Options`, HSTS condicional, etc.).
- Contraseñas de admin solo por variable de entorno (`EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD`), sin fallback hardcodeado — ya arreglado en ronda anterior. **Pendiente de confirmar con el cliente si ya rotaron la contraseña vieja expuesta en el historial de git.**

---

## 2. Riesgos e inconsistencias detectadas

Ordenados por severidad real (no por orden de aparición):

1. **[Alto] No-atomicidad ficha→pasajero.** Ver 1.2. En Postgres se resuelve con una única transacción (`BEGIN`; insert/update pasajero + update ficha; `COMMIT`). Es el bug de integridad más concreto y ya reproducible del sistema actual.
2. **[Alto] Pérdida silenciosa de domicilio/firma en fichas.** Ver 1.2. Si se migra el esquema sin agregar esos campos al endpoint público de escritura, seguimos perdiendo esa data — el problema no es solo de la base, es del contrato del endpoint actual.
3. **[Medio-alto] Sin catálogo real de colegios ni de viajes.** El backfill inicial (colegios y viajes derivados de texto libre existente) va a tener variantes de tipeo que un script automático no puede resolver todas — hace falta una pasada de revisión humana antes de dar por buena la migración de datos reales (no es solo aplicar DDL, es limpieza de datos).
4. **[Medio] Matching difuso de colegio es lógica de negocio viva, no cosmética.** Si se reemplaza por un dropdown rígido de `colegio_id` sin mantener el mismo comportamiento tolerante a errores de tipeo en el buscador público, se rompe una función que las familias usan hoy.
5. **[Medio] `inscripciones` como tabla de embudo es funcionalidad nueva, no una migración.** Hoy no existe ningún registro persistido de "empezó la inscripción pero no llegó a mandar la ficha". Camino recomendado (YAGNI): crear la fila de `inscripciones` recién en el mismo insert que la `ficha_adhesion`, en estado inicial ya `ficha_enviada`. Instrumentar el paso previo queda para una v6 si el negocio pide medir abandono del embudo.
6. **[Medio] Cero dependencias npm hoy.** `server.js` es Node puro. Se recomienda **una sola dependencia nueva: `pg`** (node-postgres, soporta transacciones reales). Para Storage, `fetch` directo contra la API REST de Supabase Storage, sin sumar `@supabase/supabase-js`.
7. **[Medio] Compatibilidad de IDs generados client-side — es infraestructura permanente, no un detalle del backfill.** Grupos, contratos y paquetes de Turismo generan su `id` en el navegador con fórmulas deterministas no-UUID (ver 1.2), y el servidor nunca les devuelve un ID propio. Esto sigue pasando en cada alta nueva **después** del corte a producción, no solo durante la carga de datos históricos — si `lib/db.js` trata `legacy_id` como un mecanismo transitorio "solo para backfill", cualquier alta nueva de grupo/contrato/paquete después de migrar rompe (Postgres no acepta un slug como valor de una columna `uuid`, y aunque se generara un UUID nuevo por dentro, el navegador nunca se entera y sigue buscando por el id viejo). Resuelto con `legacy_id` + `legacy_id_map` (DDL sección 4) tratados como parte permanente del contrato del adaptador, no como deuda a limpiar después. Para `pasajeros` y `fichas_adhesion` el mismo mecanismo alcanza pero con menor criticidad (ver 1.2: pasajeros tiene un natural key real vía documento+viaje; fichas las genera siempre el servidor).
8. **[Medio] `codigo_contrato` puede venir vacío o duplicado en datos reales.** La migración inicial no debe fallar por datos legacy imperfectos. Queda nullable con índice unique parcial; el backfill debe generar códigos estables solo cuando haga falta, reutilizando la misma fórmula que ya usa `app.js` (`adminContratoCodigo()`) para no introducir un segundo formato de código en paralelo. Documentado (no CHECK, cruza reglas de negocio): un contrato en estado `'activo'` debería tener `codigo_contrato` cargado — si no, el buscador público de Inscripción le muestra a la familia un contrato encontrado con código en blanco. Válido dejarlo null solo en `'borrador'` o durante el backfill sin limpiar todavía.
9. **[Medio] RLS no reemplaza autorización de backend.** En Supabase, la service role bypassea RLS. Entonces RLS deny-by-default protege contra exposición accidental de anon key, pero la autorización real sigue en `server.js`: sesión admin, validaciones por endpoint, rate limits y separación público/admin.
10. **[Bajo-medio] Dropdown público de destino/año desincronizado del catálogo real de grupos.** No se resuelve en esta migración (es UI/producto), pero queda documentado para que no se asuma "ya está resuelto" al migrar a `viajes`.
11. **[Bajo] Contraseña histórica expuesta en git.** Ya mitigada en código; falta confirmar rotación real en Railway.
12. **[Bajo] Dos entradas de admin (`/admin` y `/admin-turismo`) son el mismo bundle con distinto `<title>`.** Confirmado al comparar los dos HTML — no es código muerto ni un riesgo, solo aclarado para no asumir que son sistemas distintos.

---

## 3. Plan v5 por fases

**Fase 0 — Confirmación (este documento).** Wilson revisa diagnóstico, riesgos y DDL, y arranca la planificación de backend sobre esta base. Ningún archivo real del proyecto se toca hasta luz verde explícita.

**Fase 1 — Provisionar Supabase + migración inicial.** Crear proyecto Supabase, aplicar `supabase/migrations/0001_init.sql` (sección 4). Sin backfill todavía — base vacía, RLS deny-by-default activo desde el minuto uno.

**Fase 2 — `lib/db.js` (adaptador) + `lib/localDevStore.js` (modo local).** Ambos exponen la MISMA interfaz que `server.js` ya usa hoy (`readSheet(sheet)` → filas planas; `writeSheet(sheet, rows, deleteIds)` → upsert por id). `lib/db.js` traduce esa interfaz "con forma de hoja" a las tablas relacionales reales (une/separa grupos+pasajeros, resuelve colegio por nombre normalizado, aplica el matching difuso donde corresponda) y debe resolver IDs entrantes primero por `legacy_id`, después por UUID real — **este comportamiento no es transitorio, es parte permanente del contrato del adaptador mientras `app.js` siga generando sus propios IDs client-side para grupos/contratos/turismo (riesgo #7)**. `lib/localDevStore.js` es un store en memoria/JSON para desarrollar sin credenciales de Supabase — reemplaza el fallback actual de "credenciales no configuradas → datos demo" sin romper ese comportamiento.

**Fase 3 — Conectar `server.js` al adaptador, sin tocar el contrato HTTP.** `handleSheets()` sigue recibiendo `GET/POST /api/google-sheets?sheet=X` con la misma forma de payload — por dentro llama a `lib/db.js` en vez de a Google Sheets. `app.js` no cambia una sola línea en esta fase (cero riesgo de romper UI).

**Fase 4 — Backfill de datos reales.** Exportar la Sheet real de producción, normalizar colegios/viajes (revisión humana de duplicados de tipeo), cargar `personas`/`grupos`/`contratos`/`pasajeros`/`fichas_adhesion` a partir de eso, guardando el `legacy_id` de cada fila origen. **Se hace en un ambiente de staging primero**, nunca directo a producción.

**Fase 5 — Nuevo: endpoint de documentos + firma real.** Recién acá se agrega la capacidad de subir archivos/firma (hoy no existe) — endpoint nuevo (`POST /api/documentos` o extensión del POST de fichas) que sube a Storage y guarda el `storage_path` en `documentos`/`fichas_adhesion.firma_storage_path`.

**Fase 6 — Pruebas end-to-end (checklist sección 6) contra staging con datos reales backfilleados**, incluyendo crear grupos/contratos/paquetes NUEVOS después del backfill (no solo verificar los migrados).

**Fase 7 — Corte a producción.** Solo después de fases 1-6 verificadas. Mantener Google Sheets legacy de solo lectura por un tiempo (no borrar) como respaldo/comparación.

**Fase 8 — Limpieza de código legacy de Sheets** (recién acá, no antes).

No se arranca ninguna fase de código real sin confirmación explícita.

---

## 4. Migración SQL propuesta — `supabase/migrations/0001_init.sql`

```sql
create extension if not exists pgcrypto;

-- ============ FUNCIÓN COMPARTIDA PARA updated_at ============

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============ CATÁLOGO ============
-- NUEVO respecto al código actual: hoy "colegio_id" es un slug derivado en
-- el navegador (adminColegioId() en app.js), sin persistencia real. Esta
-- tabla es la primera vez que colegio es una entidad real. El backfill debe
-- normalizar nombres existentes (mayúsculas/espacios) antes de insertar acá
-- - ver Fase 4 y riesgo #3.
create table colegios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index colegios_nombre_uk on colegios (lower(nombre));
create trigger trg_colegios_updated_at before update on colegios
  for each row execute function set_updated_at();

-- NUEVO respecto al código actual: hoy no hay ningún catálogo de "viaje"
-- unificado. Estudiantil usa texto libre en GRUPOS/CONTRATOS/PASAJEROS/
-- FICHAS_ADHESION; Turismo vive en una hoja aparte (TURISMO) sin relación
-- con lo anterior. Esta tabla unifica ambos bajo `categoria`. El backfill
-- debe crear filas acá a partir de: (a) combinaciones distintas de
-- nivel+viaje encontradas en las hojas de Estudiantil, y (b) cada fila de
-- TURISMO existente. Ver Fase 4.
--
-- legacy_id: PERMANENTE, no solo para el backfill. Los paquetes de Turismo
-- nuevos siguen generando su id en el navegador (`viaje-${Date.now()}`,
-- app.js:6560) para siempre - ver riesgo #7.
create table viajes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  slug text unique,
  categoria text not null check (categoria in ('estudiantil','turismo','mixto')),
  -- Cada fila = una salida/edición concreta (tiene su propia fecha_salida),
  -- no un producto genérico recurrente con múltiples fechas adentro.
  nivel text,
  destino text not null,
  titulo text not null,
  anio integer,
  fecha_salida date,
  fecha_regreso date,
  salida_garantizada boolean not null default false,
  estado text not null default 'borrador'
    check (estado in ('borrador','revision','activo','inactivo')),
  -- Documentado (no CHECK posible sin acoplar a app): un viaje en
  -- 'activo'/'revision' debería tener slug cargado; en 'borrador' puede
  -- quedar null. Validar en lib/db.js antes de publicar.
  destacado boolean not null default false,
  orden integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index viajes_legacy_id_uk on viajes (legacy_id) where legacy_id is not null;
create index viajes_categoria_idx on viajes (categoria);
create index viajes_nivel_idx on viajes (nivel);
create trigger trg_viajes_updated_at before update on viajes
  for each row execute function set_updated_at();

-- Satélite 1:1 solo para viajes de categoría 'turismo' (precio, itinerario,
-- fotos, etc. - hoy son las columnas propias de la hoja TURISMO).
create table viajes_turismo_detalle (
  viaje_id uuid primary key references viajes(id) on delete cascade,
  duracion text,
  temporada text,
  precio_desde numeric(12,2),
  precio_valor numeric(12,2),
  moneda text default 'ARS',
  precio_base_doble numeric(12,2),
  suplemento_single numeric(12,2),
  precio_menor numeric(12,2),
  condicion_venta text,
  categorias jsonb,
  descripcion_corta text,
  descripcion_larga text,
  incluye jsonb,
  no_incluye jsonb,
  formas_pago jsonb,
  itinerario jsonb,
  fotos jsonb
);

-- ============ PERSONAS (identidad real, reutilizable entre viajes/años) ============
-- dni -> tipo_documento + numero_documento, para turistas extranjeros con
-- pasaporte (Turismo internacional). app.js ya carga
-- pasajeroTipoDocumento/responsableTipoDocumento en el objeto de ficha en
-- memoria hoy (se usa para el PDF) - esto solo formaliza en el storage lo
-- que el frontend ya modela.
create table personas (
  id uuid primary key default gen_random_uuid(),
  tipo_documento text not null default 'DNI',
  numero_documento text not null,
  nombre text not null,
  nacimiento date,
  telefono text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tipo_documento, numero_documento)
);
create index personas_nombre_idx on personas (lower(nombre));
create trigger trg_personas_updated_at before update on personas
  for each row execute function set_updated_at();

-- responsables_doc_uk: nota de esta pasada - un `unique(tipo_documento,
-- numero_documento)` plano en Postgres YA permite múltiples filas con
-- numero_documento NULL por default (NULL nunca se considera duplicado de
-- otro NULL en un unique multi-columna). El índice parcial de abajo es
-- funcionalmente equivalente a eso - se deja explícito por claridad de
-- lectura, no porque hubiera un comportamiento distinto que corregir.
create table responsables (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo_documento text not null default 'DNI',
  numero_documento text,
  telefono text,
  email text,
  cuil_cuit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index responsables_doc_uk on responsables (tipo_documento, numero_documento)
  where numero_documento is not null;
create trigger trg_responsables_updated_at before update on responsables
  for each row execute function set_updated_at();
-- NOTA: responsables con documento tienen unicidad real por índice parcial.
-- Responsables sin documento NO tienen unicidad en base: lib/db.js debe
-- intentar match blando por telefono+email+nombre normalizado y marcarlo
-- como "posible coincidencia" para revisión manual, nunca bloquear
-- automáticamente ni prometer deduplicación perfecta.

-- ============ GRUPOS / CONTRATOS / PASAJEROS ============
-- legacy_id en grupos y contratos: PERMANENTE, no solo backfill. app.js
-- genera estos IDs client-side con fórmulas deterministas
-- (groupId()/adminContratoId(), ver 1.2) y el servidor nunca les asigna un
-- ID propio (POST /api/google-sheets no devuelve la fila escrita) - esto
-- sigue pasando en cada alta nueva después de migrar, para siempre,
-- mientras no se toque esta parte de app.js. Ver riesgo #7.
create table grupos (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  viaje_id uuid not null references viajes(id) on delete restrict,
  colegio_id uuid not null references colegios(id) on delete restrict,
  curso text not null,
  division text not null,
  pasajeros_esperados integer default 0,
  estado text not null default 'activo'
    check (estado in ('activo','cerrado','cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (viaje_id, colegio_id, curso, division)
);
create unique index grupos_legacy_id_uk on grupos (legacy_id) where legacy_id is not null;
create index grupos_colegio_idx on grupos (colegio_id);
create index grupos_viaje_idx on grupos (viaje_id);
create trigger trg_grupos_updated_at before update on grupos
  for each row execute function set_updated_at();

-- viaje_id directo y obligatorio (permite Turismo sin grupo escolar);
-- grupo_id queda opcional. codigo_contrato nullable a propósito (riesgo
-- #8): datos reales de Sheets pueden venir sin código o con duplicados: la
-- migración inicial no debe fallar por eso. app.js YA exige el código a
-- nivel formulario (submitAdminContratoEdit) para altas/ediciones nuevas,
-- así que la DB más laxa solo importa para la carga histórica. Documentado
-- (no CHECK, cruza reglas de negocio): un contrato 'activo' debería tener
-- codigo_contrato cargado - si no, el buscador público de Inscripción
-- muestra el contrato encontrado con código en blanco. Puede quedar null
-- en 'borrador' o durante backfill sin limpiar todavía.
create table contratos (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  codigo_contrato text,
  viaje_id uuid not null references viajes(id) on delete restrict,
  grupo_id uuid references grupos(id) on delete restrict,
  estado text not null default 'borrador'
    check (estado in ('activo','borrador','inactivo')),
  fecha_creacion date not null default current_date,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index contratos_legacy_id_uk on contratos (legacy_id) where legacy_id is not null;
create unique index contratos_codigo_contrato_uk on contratos (codigo_contrato)
  where codigo_contrato is not null;
create index contratos_viaje_idx on contratos (viaje_id);
create index contratos_grupo_idx on contratos (grupo_id);
create index contratos_estado_idx on contratos (estado);
create trigger trg_contratos_updated_at before update on contratos
  for each row execute function set_updated_at();

-- pasajeros = una PARTICIPACIÓN de una persona en un viaje puntual. Único
-- (persona_id, viaje_id): la misma persona no se anota dos veces a la
-- MISMA salida, pero sí puede repetirse en viajes distintos.
-- legacy_id acá es más respaldo de auditoría que necesidad estructural: el
-- objeto de pasajero en memoria de app.js ni siquiera carga un campo `id`
-- (la identidad real que usa el admin es el DNI, ver 1.2) - lib/db.js
-- puede resolver identidad real vía persona.numero_documento + viaje_id en
-- vez de confiar en el id sintético que manda el cliente.
create table pasajeros (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  persona_id uuid not null references personas(id) on delete restrict,
  viaje_id uuid not null references viajes(id) on delete restrict,
  grupo_id uuid references grupos(id) on delete restrict,   -- null para Turismo sin cohorte
  contrato_id uuid references contratos(id) on delete restrict,
  estado text not null default 'pendiente'
    check (estado in ('activo','pendiente','baja')),
  documentacion_estado text not null default 'pendiente'
    check (documentacion_estado in ('pendiente','completa','rechazada')),
  ficha_medica_estado text not null default 'pendiente'
    check (ficha_medica_estado in ('pendiente','cargada','observada')),
  pago_estado text not null default 'pendiente'
    check (pago_estado in ('pendiente','al_dia','vencido')),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (persona_id, viaje_id)
);
create unique index pasajeros_legacy_id_uk on pasajeros (legacy_id) where legacy_id is not null;
create index pasajeros_persona_idx on pasajeros (persona_id);
create index pasajeros_grupo_idx on pasajeros (grupo_id);
create index pasajeros_contrato_idx on pasajeros (contrato_id);
create index pasajeros_estado_idx on pasajeros (estado);
create trigger trg_pasajeros_updated_at before update on pasajeros
  for each row execute function set_updated_at();

create table pasajero_responsables (
  pasajero_id uuid not null references pasajeros(id) on delete cascade,
  responsable_id uuid not null references responsables(id) on delete cascade,
  vinculo text not null,
  es_principal boolean not null default false,
  primary key (pasajero_id, responsable_id)
);
create index pasajero_responsables_resp_idx on pasajero_responsables (responsable_id);

-- ============ INSCRIPCIONES (embudo) ============
-- Ver riesgo #5: hoy NO existe ningún registro de "inscripción iniciada" -
-- el flujo público vive en memoria/URL hasta que se manda la ficha. Camino
-- recomendado para v1 (más chico, YAGNI): crear la fila de inscripciones
-- en el MISMO insert que la ficha_adhesion, ya en estado 'ficha_enviada'.
-- Instrumentar el paso previo queda para una v6 si el negocio pide medir
-- abandono del embudo.
create table inscripciones (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete restrict,
  viaje_id uuid not null references viajes(id) on delete restrict,
  grupo_id uuid references grupos(id) on delete restrict,
  contrato_id uuid references contratos(id) on delete restrict,
  pasajero_id uuid references pasajeros(id) on delete restrict,   -- se setea al aprobar
  colegio_texto text,
  curso_division_texto text,
  nivel text,
  estado text not null default 'iniciada'
    check (estado in ('iniciada','ficha_enviada','duplicada','cancelada')),
  duplicada_de_id uuid references inscripciones(id) on delete restrict,
  origen text not null default 'web'
    check (origen in ('web','whatsapp','admin_manual','campana','referido')),
  utm_source text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (estado <> 'duplicada' or duplicada_de_id is not null)
);
create index inscripciones_persona_idx on inscripciones (persona_id);
create index inscripciones_viaje_idx on inscripciones (viaje_id);
create index inscripciones_estado_idx on inscripciones (estado);
create index inscripciones_created_idx on inscripciones (created_at);
create index inscripciones_estado_created_idx on inscripciones (estado, created_at);
create trigger trg_inscripciones_updated_at before update on inscripciones
  for each row execute function set_updated_at();
-- Duplicados: detección ADVISORY en lib/db.js (busca persona_id+viaje_id
-- existente antes de insertar), NO bloqueante en la base - puede haber
-- duplicados reales por error de tipeo que un humano necesita revisar.
-- IMPORTANTE: pasar estado a 'ficha_enviada' debe hacerse en la MISMA
-- transacción que el insert de fichas_adhesion - nunca dejar
-- 'ficha_enviada' sin una ficha real asociada.

-- ============ FICHAS DE ADHESIÓN (1:1 con inscripción) ============
-- Incluye domicilio completo, tipo/número de documento y firma - campos
-- que app.js YA arma en el objeto ficha en memoria (se usan para el PDF)
-- pero que HOY NUNCA llegan al servidor. Persistirlos es funcionalidad
-- nueva, no migración de datos existentes.
--
-- legacy_id acá SOLO es para auditoría del backfill (a diferencia de
-- grupos/contratos/viajes): el id de ficha lo genera hoy el SERVIDOR
-- (`ficha-${Date.now()}-${hex}` en server.js), nunca el navegador - no hay
-- ningún cliente que dependa de preservar ese formato después de migrar.
create table fichas_adhesion (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  inscripcion_id uuid not null unique references inscripciones(id) on delete restrict,

  pasajero_nombre text not null,
  pasajero_tipo_documento text not null default 'DNI',
  pasajero_numero_documento text not null,
  pasajero_nacimiento date,
  pasajero_sexo text,

  -- nullable a nivel de columna: la obligatoriedad depende de la categoría
  -- del viaje, validado en aplicación, no en constraint de DB.
  responsable_nombre text,
  responsable_tipo_documento text default 'DNI',
  responsable_numero_documento text,
  responsable_nacimiento date,
  responsable_parentesco text,
  responsable_email text,
  responsable_telefono text,
  responsable_celular text,
  responsable_cuil_cuit text,

  domicilio_calle text,
  domicilio_numero text,
  domicilio_piso text,
  domicilio_departamento text,
  domicilio_localidad text,
  domicilio_provincia text,
  domicilio_codigo_postal text,

  acepta_condiciones boolean not null default false,
  -- Path estable en Storage, NUNCA una URL firmada (que vence). La URL
  -- firmada se genera al vuelo desde server.js cuando hace falta mostrarla.
  firma_storage_path text,
  firma_bucket text not null default 'firmas',

  estado_revision text not null default 'pendiente'
    check (estado_revision in ('pendiente','revisada','observada','duplicada','aprobada','rechazada')),
  documentacion_estado text default 'pendiente',
  ficha_medica_estado text default 'pendiente',
  autorizacion_estado text default 'pendiente',
  motivo_rechazo text,
  aprobado_con_excepcion boolean not null default false,
  observaciones text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- CHECKs legales: no se puede aprobar sin aceptar condiciones, y no se
  -- puede aprobar sin firma real salvo excepción explícita de un admin.
  check (estado_revision <> 'aprobada' or acepta_condiciones = true),
  check (estado_revision <> 'aprobada' or firma_storage_path is not null or aprobado_con_excepcion = true)
);
create unique index fichas_legacy_id_uk on fichas_adhesion (legacy_id) where legacy_id is not null;
create index fichas_estado_revision_idx on fichas_adhesion (estado_revision);
create index fichas_dni_idx on fichas_adhesion (pasajero_numero_documento);
create index fichas_nombre_idx on fichas_adhesion (lower(pasajero_nombre));
create index fichas_created_idx on fichas_adhesion (created_at);
create trigger trg_fichas_updated_at before update on fichas_adhesion
  for each row execute function set_updated_at();

-- ============ DOCUMENTOS (genérico, polimórfico — trade-off documentado) ============
-- 100% funcionalidad nueva: hoy no existe ningún upload de archivo en el
-- sistema. Postgres no puede validar un FK real cruzando entidad_tipo +
-- entidad_id - lib/db.js DEBE confirmar que entidad_id existe en la tabla
-- que indica entidad_tipo antes de insertar acá.
create table documentos (
  id uuid primary key default gen_random_uuid(),
  entidad_tipo text not null
    check (entidad_tipo in ('persona','pasajero','ficha_adhesion','contrato','inscripcion')),
  entidad_id uuid not null,
  tipo_documento text not null
    check (tipo_documento in ('dni_frente','dni_dorso','ficha_medica','autorizacion','comprobante_pago','contrato_firmado','otro')),
  storage_bucket text not null default 'documentos',
  storage_path text not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aprobado','rechazado')),
  observaciones text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documentos_entidad_idx on documentos (entidad_tipo, entidad_id);
create index documentos_tipo_estado_idx on documentos (tipo_documento, estado);
create trigger trg_documentos_updated_at before update on documentos
  for each row execute function set_updated_at();

-- ============ MAPEO LEGACY / IDs EXTERNOS ============
-- Cubre casos ambiguos, auditoría de migración y sirve de respaldo cuando
-- legacy_id de la tabla principal no alcanza. No reemplaza a legacy_id en
-- viajes/grupos/contratos (que es el camino rápido y permanente, ver
-- riesgo #7) - complementa para trazabilidad completa del origen de cada
-- fila.
create table legacy_id_map (
  id bigserial primary key,
  source text not null default 'google_sheets',
  sheet_name text not null
    check (sheet_name in ('GRUPOS','CONTRATOS','PASAJEROS','FICHAS_ADHESION','TURISMO','CONFIG','PAGOS','CUOTAS')),
  legacy_id text not null,
  entidad_tipo text not null,
  entidad_id uuid not null,
  created_at timestamptz not null default now(),
  unique (source, sheet_name, legacy_id)
);
create index legacy_id_map_entidad_idx on legacy_id_map (entidad_tipo, entidad_id);

-- ============ CONFIG ============

create table config (
  clave text primary key,
  valor text,
  descripcion text,
  updated_at timestamptz not null default now()
);
create trigger trg_config_updated_at before update on config
  for each row execute function set_updated_at();

-- ============ ADMIN / AUDITORÍA ============
-- admin_usuarios NO guarda contraseñas y NO reemplaza la autenticación real
-- (que sigue siendo EAA_ADMIN_PASSWORD/EAA_AGENCIA_PASSWORD en server.js,
-- sesión en memoria). Existe solo para que eventos_administrativos.actor_id
-- tenga a qué apuntar.
create table admin_usuarios (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  nombre text not null,
  email text,
  rol text not null check (rol in ('admin','agencia')),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_admin_usuarios_updated_at before update on admin_usuarios
  for each row execute function set_updated_at();
insert into admin_usuarios (username, nombre, rol) values
  ('admin', 'Admin', 'admin'),
  ('agencia', 'Agencia', 'agencia');

-- Auditoría: NO existe hoy ningún log de acciones de admin. Dado que hay
-- PII de menores de edad de por medio, esta tabla tiene alto valor y bajo
-- costo (un insert por mutación relevante en lib/db.js).
create table eventos_administrativos (
  id bigserial primary key,
  entidad text not null,
  entidad_id uuid,
  accion text not null,
  actor_id uuid references admin_usuarios(id) on delete set null,
  actor_username text not null,
  detalle jsonb,
  created_at timestamptz not null default now()
);
create index eventos_entidad_idx on eventos_administrativos (entidad, entidad_id);
create index eventos_created_idx on eventos_administrativos (created_at);

-- ============ ROW LEVEL SECURITY: deny-by-default en todo ============
-- Ninguna tabla tiene policies todavía - a propósito. El único cliente que
-- habla con Postgres es server.js con la service role key. En Supabase, la
-- service role BYPASS RLS: por eso la autorización real se aplica en
-- server.js (sesión admin, endpoints públicos acotados, rate limits,
-- validaciones y separación público/admin). RLS acá es defensa en
-- profundidad: si alguna vez se expone una anon key al navegador por error,
-- deny-by-default significa que esa key no puede leer/escribir NADA hasta
-- que se agregue una policy explícita a propósito. No se planea usar
-- Supabase Auth ni anon key desde el navegador en esta migración.
alter table colegios enable row level security;
alter table viajes enable row level security;
alter table viajes_turismo_detalle enable row level security;
alter table personas enable row level security;
alter table responsables enable row level security;
alter table grupos enable row level security;
alter table contratos enable row level security;
alter table pasajeros enable row level security;
alter table pasajero_responsables enable row level security;
alter table inscripciones enable row level security;
alter table fichas_adhesion enable row level security;
alter table documentos enable row level security;
alter table legacy_id_map enable row level security;
alter table config enable row level security;
alter table admin_usuarios enable row level security;
alter table eventos_administrativos enable row level security;
```

### `supabase/migrations/0002_pagos_futuro.sql` (diseñado, NO aplicado)

Sin cambios: `cuotas`/`pagos` referenciando `pasajeros(id)`/`contratos(id)`, mismos estados normalizados a lowercase. Confirmado que `PAGOS`/`CUOTAS` no tienen escritura habilitada hoy (`WRITE_ALLOWED` en `server.js`) — sigue sin ser prioridad.

### Política de retención

- No hay `DELETE` físico por defecto en ninguna tabla con datos personales (hay menores de edad de por medio).
- Los estados existentes (`baja`, `cancelada`, `rechazada`, `duplicada`) son el mecanismo de baja lógica.
- Documentos siempre privados, acceso solo vía URL firmada de corta duración generada por `server.js`.
- Un borrado o exportación real de los datos de una persona puntual es una operación manual, a pedido explícito del cliente — nunca un proceso automático programado.

### Storage: buckets y convención de paths

- Dos buckets privados: `documentos` y `firmas`. Nunca públicos, nunca accedidos con anon key desde el navegador.
- Convención de `storage_path`: `{entidad_tipo}/{entidad_id}/{tipo_documento}-{timestamp}.{ext}` (ej. `ficha_adhesion/3f9.../firma-1721490000.png`). **El path usa el UUID de la entidad, nunca el DNI/nombre.**
- URLs firmadas se generan al vuelo desde `server.js` con la service role key, con expiración corta (ej. 5-10 minutos), nunca se persisten.

### Seguridad real con service role

- RLS deny-by-default queda activo en todas las tablas como defensa ante exposición accidental de una anon key.
- La service role de Supabase bypassea RLS. Por eso no se debe presentar RLS como el control principal de permisos de esta arquitectura.
- El control real de permisos vive en `server.js`: cookies de sesión admin, validación por endpoint, rate limits, same-origin para escrituras y endpoints públicos muy acotados.
- La service role debe existir solo como variable de entorno server-side en Railway/local `.env`, nunca en `app.js`, archivos estáticos, logs, responses ni bundle del navegador.

---

## 5. Cambios de backend necesarios

### 5.1 Dependencias nuevas (la primera vez que este proyecto suma una)

- **`pg`** (node-postgres): único driver realista para Postgres desde Node, necesario para transacciones reales (ej. aprobar ficha → crear pasajero de forma atómica). Conexión vía `DATABASE_URL`/`SUPABASE_DB_URL` (pooler de Supabase, modo transacción).
- **Storage: sin SDK nuevo.** `fetch` directo contra la API REST de Supabase Storage (mismo patrón que `server.js` ya usa para firmar JWT de Google Sheets) — evita sumar `@supabase/supabase-js` completo.

### 5.2 Endpoints que deben conservar interfaz (no romper el frontend)

- `GET/POST /api/google-sheets?sheet=NOMBRE` — **se mantiene como está** (mismo shape de payload). Por dentro, `handleSheets()` deja de llamar a Google Sheets y llama a `lib/db.js`.
- `GET /api/admin/me`, `POST /api/admin/login`, `POST /api/admin/logout` — sin cambios, siguen siendo sesión en memoria + `EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD`. No se introduce Supabase Auth.
- Nuevo (Fase 5, no antes): endpoint para subir documento/firma.

### 5.3 `lib/db.js` — responsabilidades de la capa de aplicación (no son constraints de DB)

- **Traducción hoja↔tabla**: reconstruir el árbol grupo+pasajeros anidado que `app.js` espera al leer `GRUPOS`/`PASAJEROS`, igual que hace `applyGoogleSheetsRows()` hoy — pero leyendo de tablas relacionales reales.
- **Resolución de colegio por nombre**: al recibir un `colegio` de texto, buscar en `colegios` por `lower(nombre)` exacto primero; si no existe, crearlo.
- **Matching difuso de colegio para Inscripción pública**: portar `resolveInscripcionContract()`/`schoolSimilarityScore()` (Levenshtein) a `lib/db.js` server-side. Es lógica de negocio existente que hay que preservar, no simplificar.
- **DNI/documento**: normalizar a solo dígitos reutilizando `normalizeFichaDni()` (ya existe en `app.js`, portar tal cual). Teléfono normalizado a solo dígitos. Email `trim()`+`lowercase()` siempre.
- **Regla real de identidad/duplicados**: `personas(tipo_documento, numero_documento)` garantiza una identidad global por documento. `pasajeros(persona_id, viaje_id)` evita doble inscripción de la misma persona a la misma salida. La misma persona en otro viaje no debe bloquearse a nivel base; debe mostrarse como historial/alerta operativa.
- **Responsable sin documento**: match blando por teléfono+email+nombre normalizado, marcado "posible coincidencia", nunca bloqueado automáticamente.
- **Inscripción duplicada**: búsqueda advisory por `persona_id`+`viaje_id` antes de insertar, sin bloquear.
- **IDs externos generados client-side (permanente, no solo backfill) — regla corregida en v5**: al recibir un `id` en el payload de `GRUPOS`/`CONTRATOS`/`TURISMO` que no sea un UUID válido, guardarlo en `legacy_id` y devolverlo tal cual (nunca el UUID interno) en toda lectura futura de esa fila — sin importar si la fila es histórica (backfill) o si nació recién en Postgres por un alta nueva desde el admin. Solo se puede devolver el UUID real cuando la entidad es de un tipo que el servidor SIEMPRE generó (`fichas_adhesion`, `personas`, `inscripciones`) y ningún cliente depende de otro formato. Para `pasajeros`, resolver identidad preferentemente vía `persona.numero_documento + viaje_id` (el natural key real) antes que confiar en el `id` sintético del payload — `legacy_id` ahí queda como respaldo de auditoría, no como mecanismo principal.
- **Resolución de ID entrante en updates/deletes**: primero por `legacy_id` de la tabla correspondiente, después por `legacy_id_map` para casos ambiguos.
- **Contratos sin código legacy**: durante backfill, si `codigo_contrato` viene vacío, generar un código estable reutilizando la misma fórmula que `adminContratoCodigo()` ya usa en `app.js` (nivel+colegio+curso/división+viaje), para no introducir un segundo formato de código en paralelo. Si viene duplicado, cargar uno como principal y marcar conflicto para revisión humana antes del corte final. Validar en aplicación (no CHECK): un contrato `activo` sin código es una alerta a resolver antes de exponerlo al buscador público.
- **`documentos` polimórfico**: confirmar que `entidad_id` existe en la tabla correspondiente a `entidad_tipo` antes de insertar.
- **Transacción de aprobación de ficha**: `BEGIN` → crear/actualizar `pasajero` (y `persona` si no existía) → actualizar `fichas_adhesion.estado_revision = 'aprobada'` → insertar en `eventos_administrativos` → `COMMIT`. Si cualquier paso falla, rollback completo.
- **Auditoría**: insertar una fila en `eventos_administrativos` en cada mutación relevante desde el admin, con `actor_username` tomado de la sesión actual.

### 5.4 `lib/localDevStore.js`

Mismo shape de interfaz que `lib/db.js`, respaldado por un store en memoria (o JSON en disco para persistir entre reinicios locales). `server.js` elige entre `lib/db.js` (si hay `DATABASE_URL`) y `lib/localDevStore.js` (si no) al arrancar.

---

## 6. Checklist de pruebas end-to-end antes de aprobar implementación

A correr contra un proyecto Supabase de **staging**, nunca contra producción directamente:

**Esquema**
- [ ] `0001_init.sql` corre sin errores en un proyecto Supabase limpio.
- [ ] Los triggers de `updated_at` disparan correctamente en un `UPDATE` de prueba en cada tabla que los tiene.
- [ ] `legacy_id` permite mapear filas backfilleadas de GRUPOS/CONTRATOS/PASAJEROS/FICHAS_ADHESION/TURISMO sin perder compatibilidad con updates/deletes del frontend actual.
- [ ] **Nuevo en v5**: crear un grupo, un contrato y un paquete de Turismo *nuevos* desde el admin **después** de correr el backfill (no solo verificar los migrados) — confirmar que el id client-side (slug/timestamp) que `app.js` sigue generando se guarda como `legacy_id`, se devuelve igual en la siguiente lectura, y que el admin puede seguir encontrando/editando esa fila con el mismo id de siempre.
- [ ] `legacy_id_map` rechaza duplicados para `(source, sheet_name, legacy_id)` y permite auditar a qué entidad UUID terminó apuntando cada fila legacy.
- [ ] `unique(persona_id, viaje_id)` en `pasajeros`: permite la misma persona en dos viajes distintos, rechaza la misma persona dos veces en el mismo viaje.
- [ ] `responsables_doc_uk` rechaza dos responsables con el mismo documento, pero permite múltiples responsables sin documento.
- [ ] `contratos_codigo_contrato_uk` rechaza códigos repetidos cuando existen, pero permite contratos legacy con `codigo_contrato = null` durante backfill.
- [ ] Un contrato de Turismo se puede crear con `grupo_id = null`.
- [ ] Los CHECK legales de `fichas_adhesion` bloquean `estado_revision = 'aprobada'` sin `acepta_condiciones = true`, y sin firma salvo `aprobado_con_excepcion = true`.
- [ ] `inscripciones` rechaza `estado = 'duplicada'` sin `duplicada_de_id`.

**Compatibilidad de endpoints**
- [ ] `GET /api/google-sheets?sheet=GRUPOS` (y CONTRATOS/PASAJEROS/FICHAS_ADHESION/TURISMO) devuelve el mismo shape de filas que hoy devuelve Sheets, sin cambiar `app.js`.
- [ ] `POST /api/google-sheets` con `sheet=FICHAS_ADHESION` sin sesión (público) sigue funcionando con las mismas reglas.
- [ ] Sesión de admin sin cambios de comportamiento.

**Flujo funcional (el corazón del sistema)**
- [ ] Inscripción pública: colegio tipeado con errores menores de tipeo sigue encontrando el contrato correcto (matching difuso preservado).
- [ ] Envío de ficha de adhesión pública guarda ahora domicilio completo, tipo/número de documento y firma.
- [ ] Aprobar una ficha crea el pasajero Y actualiza el estado de la ficha en la misma operación; forzar un fallo a mitad de camino y confirmar que NO queda un pasajero huérfano.
- [ ] Documento duplicado: crear una persona con el mismo `tipo_documento + numero_documento` reutiliza/detecta la identidad global existente.
- [ ] Doble inscripción: la misma persona no puede quedar dos veces como pasajero del mismo viaje; en otro viaje se permite.
- [ ] Navegar entre secciones del admin (Fichas → Pasajeros → Grupos) no pierde datos reales recién creados.
- [ ] Turismo: crear/editar/publicar un paquete sigue funcionando igual desde `/admin/turismo`.
- [ ] Documentos: subir un archivo de prueba, confirmar que el path guardado no contiene DNI/nombre, y que la URL firmada generada expira.

**Seguridad**
- [ ] RLS deny-by-default confirmado: con la anon key (sin service role), ningún `select`/`insert` funciona en ninguna tabla.
- [ ] Confirmar explícitamente que la service role bypassea RLS y que los permisos reales quedan aplicados en `server.js`, no en policies de Supabase.
- [ ] Solo `server.js` tiene la service role key.
- [ ] Repetir el smoke test de seguridad ya hecho antes (PII de menores no accesible sin sesión) contra los nuevos endpoints.

**Rendimiento/carga**
- [ ] Con datos backfilleados reales de producción, los índices de búsqueda del admin responden razonablemente rápido en las pantallas de Fichas/Pasajeros.

---

## Qué sigue

Esta v5 reemplaza a la v4.1 como referencia vigente. Falta: revisión de Wilson sobre los ajustes de esta pasada (riesgo #7 reformulado, regla de `lib/db.js` corregida, nota de `codigo_contrato` activo, nota de identidad de pasajeros) y luego arranque de la planificación de backend de su parte. Confirmación explícita antes de tocar cualquier archivo real del proyecto — mismo criterio que todas las rondas anteriores.
