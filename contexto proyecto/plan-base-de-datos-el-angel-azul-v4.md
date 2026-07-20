# Plan de migración a base de datos real (Supabase/PostgreSQL) — v4

**Estado: auditoría completa desde cero (20/07/2026) + plan v4 listo para revisión de Wilson. Cero código real tocado. Cero datos migrados todavía.**

Esta versión reemplaza a la v3 (`plan-base-de-datos-el-angel-azul-v3.docx`). A diferencia de las rondas anteriores, esta se hizo releyendo el código actual línea por línea (server.js completo, los módulos de persistencia, y las rutas de admin/inscripción/fichas/turismo en `app.js`) en vez de partir de la memoria de conversaciones previas. Varios supuestos de la v3 no coincidían exactamente con lo que el código hace hoy — se explican abajo en el diagnóstico y se corrigieron en el esquema.

---

## 1. Diagnóstico del código actual

### 1.1 Arquitectura real (verificada, no supuesta)

- **Un solo backend** (`server.js`, 638 líneas, Node puro sin dependencias — `package.json` tiene `"dependencies": {}`). Sirve archivos estáticos, autenticación de admin por cookie de sesión en memoria, y un único endpoint de datos: `GET/POST /api/google-sheets?sheet=NOMBRE`.
- **Google Sheets es la única base de datos real hoy.** El "esquema" verdadero no es un documento de diseño — es el objeto `SCHEMA` en `server.js:140-149`, siete hojas: `GRUPOS`, `CONTRATOS`, `PASAJEROS`, `FICHAS_ADHESION`, `PAGOS`, `CUOTAS`, `TURISMO`, `CONFIG`. Cada hoja es una tabla plana de texto (sin tipos, sin FKs, sin constraints — Sheets no los tiene).
- **El frontend nunca habla con Sheets directo.** Todo pasa por `fetchGoogleSheetRows`/`writeGoogleSheetRows` en `assets/js/modules/persistence.js`, que a su vez llaman a `/api/google-sheets`. Este endpoint ya es exactamente el patrón de "proxy server-side con service role" que se planeaba para Supabase — la migración reemplaza el interior de `handleSheets()`, no la forma en que el frontend lo consume.
- **`ElAngelAzulPersistence.providers`** ya declara placeholders `supabase`/`firebase` con solo un `status` de texto — no hay ninguna integración real todavía, son etiquetas de UI en la pantalla de Configuración del admin.

### 1.2 Cómo se modelan hoy los datos (esto es lo que cambió respecto a lo que asumía la v3)

**Grupos y pasajeros no son colecciones separadas en memoria — son un árbol anidado.** `adminPasajerosDemo` es un array de **grupos**, y cada grupo tiene un array `pasajeros` adentro (`app.js:2906-2934`, `sheetGroupFromRow`/`sheetPassengerFromRow` en `2992-3024`). El nombre de la variable es engañoso: no es "los pasajeros", es "los grupos, con sus pasajeros anidados". Al sincronizar con Sheets, se reconstruye ese árbol a partir de dos hojas planas (`GRUPOS` + `PASAJEROS` unidas por `grupo_id`, `applyGoogleSheetsRows` en `3057-3076`).

**No existe una tabla/hoja de colegios.** `colegio_id` en `CONTRATOS` **no es un ID real ni persistente** — se deriva client-side al vuelo con `adminColegioId()` (`app.js:2237-2239`): `colegio-${slug(nombre)}`. Es decir, hoy "colegio" es solo texto libre (`colegio` en `GRUPOS`, `colegio_nombre` en `CONTRATOS`), sin catálogo real. Cualquier variación de tipeo ("Colegio San Martín" vs "Colegio San Martin ") crea entidades distintas en la práctica.

**No existe un catálogo de viajes unificado.** Lo que hoy se llama "viaje" en `GRUPOS`/`CONTRATOS`/`PASAJEROS`/`FICHAS_ADHESION` es **texto libre** (`"Bariloche 2026"`), nunca un ID. Turismo, en cambio, vive en una hoja completamente aparte (`TURISMO`) con su propio `id`/`slug`, sin ninguna relación con `GRUPOS`/`CONTRATOS`. Hoy son **dos sistemas separados que no se tocan**: Estudiantil (Grupos→Contratos→Pasajeros→Fichas) y Turismo (catálogo de paquetes con CTA de WhatsApp, sin inscripción digital ni pasajeros vinculados).

**El emparejamiento de colegio en Inscripción pública es difuso a propósito, no por ID.** `resolveInscripcionContract()` (`app.js:2385-2416`) usa distancia de Levenshtein normalizada (`schoolSimilarityScore`) sobre el nombre de colegio tipeado por la familia contra `colegio_nombre` de los contratos activos, filtrando primero por nivel+viaje+curso/división exactos. Esto es una función real de negocio (tolera errores de tipeo/mayúsculas) que **hay que preservar como lógica de aplicación**, no reemplazar por un `<select>` rígido de colegio_id — si se migra a FKs duros sin mantener este matching difuso server-side, se rompe la búsqueda de contrato para cualquier familia que no tipee el nombre exacto.

**El dropdown de destino/año en Inscripción pública es fijo en código, no viene de datos reales.** `inscripcionDestinosPorNivel`/`inscripcionAnios` (`app.js:7249-7253`) son constantes hardcodeadas. Si el admin carga un grupo nuevo para "Bariloche 2029", el formulario público no lo va a ofrecer como opción hasta que alguien edite `app.js`. No es un bug que haya que arreglar en esta migración (es un gap de UX/producto, fuera de alcance de "no tocar UI"), pero **si en algún momento se decide exponer un catálogo real de viajes al público, este es el punto de enganche** — se anota como mejora futura, no se resuelve ahora.

**La ficha de adhesión pública recolecta mucha más data de la que persiste hoy.** El objeto `ficha` que arma el frontend (usado para generar el PDF, `renderFichaPdf` ~línea 3979-4115) incluye `pasajeroTipoDocumento`, `responsableTipoDocumento`, `domicilioCalle/Numero/Piso/Departamento/Localidad/Provincia/Telefono/Celular/CodigoPostal`, y **una firma** (`ficha.firma`, usada con `loadPdfImage()` para estampar el PDF). Ninguno de estos campos existe en `SCHEMA.FICHAS_ADHESION` de `server.js` (que solo tiene `pasajero_dni`, `pasajero_nombre`, `responsable_nombre`, `responsable_telefono` y los campos de estado/asignación). **Conclusión importante: hoy esos datos (domicilio completo, tipo de documento, firma) nunca llegan al servidor — viven solo en el navegador que llenó el formulario, se usan para el PDF al vuelo, y se pierden.** Migrar a Supabase con el esquema de fichas completo (que ya incluía estos campos desde la v3) no es solo "cambiar de base de datos" — es la primera vez que esta información se guarda de verdad server-side. Hay que tratarlo como una funcionalidad nueva que agregar al POST público de fichas, no como una migración de datos existentes (no hay domicilios/firmas reales que migrar, porque nunca se guardaron).

**No existe ningún mecanismo de carga de documentos (DNI, ficha médica, comprobante) hoy.** Se buscó explícitamente (`type="file"`, `FileReader`, subida de adjuntos) y no hay nada — `documentacion_estado`/`ficha_medica_estado` son etiquetas manuales que el admin cambia a mano ("Pendiente"/"Completa"/"Observada"), sin ningún archivo real detrás. La tabla `documentos` + Storage de la v3 es **100% funcionalidad nueva**, no tiene datos legacy que migrar.

**PAGOS/CUOTAS están definidas en el esquema pero no se pueden escribir.** `WRITE_ALLOWED` en `server.js:151` no incluye `PAGOS` ni `CUOTAS` — confirma lo que ya se sabía (memoria de deuda técnica): el admin de Pagos/Cuotas nunca tuvo sincronización real, son datos parcialmente locales. Se mantiene la decisión ya tomada en v3 de dejarlas como módulo futuro (`0002_pagos_futuro.sql`), sin tocar ahora.

**El DNI es la clave de identidad real, pero solo se valida en JavaScript, nunca en el storage.** La hoja `PASAJEROS` no tiene ningún constraint de unicidad (Sheets no puede tenerlo); la unicidad global de DNI la hace `app.js` a mano recorriendo `adminPasajerosDemo` completo antes de crear/editar (fix del 17/07). Esto es exactamente lo que un `unique` real en Postgres resuelve de raíz.

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
2. **[Alto] Pérdida silenciosa de domicilio/firma en fichas.** Ver 1.2. Si se migra el esquema sin also agregar esos campos al endpoint público de escritura, seguimos perdiendo esa data — el problema no es solo de la base, es del contrato del endpoint actual.
3. **[Medio-alto] Sin catálogo real de colegios ni de viajes.** El backfill inicial (colegios y viajes derivados de texto libre existente) va a tener variantes de tipeo que un script automático no puede resolver todas — hace falta una pasada de revisión humana antes de dar por buena la migración de datos reales (no es solo aplicar DDL, es limpieza de datos).
4. **[Medio] Matching difuso de colegio es lógica de negocio viva, no cosmética.** Si se reemplaza por un dropdown rígido de `colegio_id` sin mantener el mismo comportamiento tolerante a errores de tipeo en el buscador público, se rompe una función que las familias usan hoy (aunque no haya evidencia de que siempre funcionó bien en producción — ver bug #4 de la auditoría del 18/07 sobre datos reales vs. semilla ficticia).
5. **[Medio] `inscripciones` como tabla de embudo es funcionalidad nueva, no una migración.** Hoy no existe ningún registro persistido de "empezó la inscripción pero no llegó a mandar la ficha" — el flujo público (nivel/destino/colegio/curso) vive solo en memoria del navegador y en query params de la URL hasta que se envía la ficha. Si se quiere la tabla `inscripciones` con estados `iniciada`/`ficha_enviada`, hay que agregar una llamada nueva al backend en el paso de "colegio+curso resueltos" de `bindInscripcion()` — no es gratis, es una pieza de instrumentación nueva. **Alternativa más chica: no instrumentar el embudo todavía, y crear la fila de `inscripciones` recién en el mismo insert que la `ficha_adhesion` (estado inicial ya `ficha_enviada`), dejando el tracking de abandono para una v5 futura si el negocio lo pide.** Recomendado dado el alcance ya grande de esta migración — evita construir analítica de embudo que nadie pidió todavía (YAGNI).
6. **[Medio] Cero dependencias npm hoy.** `server.js` es Node puro. Agregar Postgres real necesita al menos un driver — no hay forma de hablar con Postgres desde Node sin una librería (no es un caso donde stdlib alcance). Se recomienda **una sola dependencia nueva: `pg`** (node-postgres, el driver estándar, soporta transacciones reales). Para Storage, usar `fetch` directo contra la API REST de Supabase Storage (mismo estilo que ya usa `server.js` para firmar JWT de Google — sin sumar el SDK completo `@supabase/supabase-js`, que trae mucho más de lo que hace falta acá).
7. **[Bajo-medio] Dropdown público de destino/año desincronizado del catálogo real de grupos.** Ver 1.2. No se resuelve en esta migración (es UI/producto), pero queda documentado para que no se asuma "ya está resuelto" al migrar a `viajes`.
8. **[Bajo] Contraseña histórica expuesta en git.** Ya mitigada en código; falta confirmar rotación real en Railway. No depende de esta migración pero es buen momento para preguntar de nuevo.
9. **[Bajo] Dos entradas de admin (`/admin` y `/admin-turismo`) son el mismo bundle con distinto `<title>`.** Confirmado al comparar los dos HTML — no es código duerto ni un riesgo, solo aclarado para no asumir que son sistemas distintos.

---

## 3. Plan v4 por fases

El orden ya fue pre-aprobado conceptualmente en rondas anteriores; esta versión lo hace más concreto con lo que se encontró en el código real.

**Fase 0 — Confirmación (este documento).** Wilson revisa diagnóstico, riesgos y DDL. Ningún archivo real del proyecto se toca hasta luz verde explícita.

**Fase 1 — Provisionar Supabase + migración inicial.** Crear proyecto Supabase, aplicar `supabase/migrations/0001_init.sql` (sección 4). Sin backfill todavía — base vacía, RLS deny-by-default activo desde el minuto uno.

**Fase 2 — `lib/db.js` (adaptador) + `lib/localDevStore.js` (modo local).** Ambos exponen la MISMA interfaz que `server.js` ya usa hoy (`readSheet(sheet)` → filas planas; `writeSheet(sheet, rows, deleteIds)` → upsert por id). `lib/db.js` traduce esa interfaz "con forma de hoja" a las tablas relacionales reales (une/separa grupos+pasajeros, resuelve colegio por nombre normalizado, aplica el matching difuso donde corresponda). `lib/localDevStore.js` es un store en memoria/JSON para desarrollar sin credenciales de Supabase — reemplaza el fallback actual de "credenciales no configuradas → datos demo" sin romper ese comportamiento.

**Fase 3 — Conectar `server.js` al adaptador, sin tocar el contrato HTTP.** `handleSheets()` sigue recibiendo `GET/POST /api/google-sheets?sheet=X` con la misma forma de payload — por dentro llama a `lib/db.js` en vez de a Google Sheets. `app.js` no cambia una sola línea en esta fase (cero riesgo de romper UI). Esto es lo que permite cumplir "no tocar la UI visual salvo estrictamente necesario por datos".

**Fase 4 — Backfill de datos reales.** Exportar la Sheet real de producción, normalizar colegios/viajes (revisión humana de duplicados de tipeo), cargar `personas`/`grupos`/`contratos`/`pasajeros`/`fichas_adhesion` a partir de eso. **Se hace en un ambiente de staging primero**, nunca directo a producción.

**Fase 5 — Nuevo: endpoint de documentos + firma real.** Recién acá se agrega la capacidad de subir archivos/firma (hoy no existe) — endpoint nuevo (`POST /api/documentos` o extensión del POST de fichas) que sube a Storage y guarda el `storage_path` en `documentos`/`fichas_adhesion.firma_storage_path`. Este es trabajo de funcionalidad nueva, se separa a propósito de "migrar lo que ya existe" (fases 1-4).

**Fase 6 — Pruebas end-to-end (checklist sección 6) contra staging con datos reales backfilleados.**

**Fase 7 — Corte a producción.** Solo después de fases 1-6 verificadas. Mantener Google Sheets legacy de solo lectura por un tiempo (no borrar) como respaldo/comparación.

**Fase 8 — Limpieza de código legacy de Sheets** (recién acá, no antes).

No se arranca ninguna fase de código real sin confirmación explícita — mismo criterio que las 3 rondas anteriores.

---

## 4. Migración SQL propuesta — `supabase/migrations/0001_init.sql`

Aplica los 10 ajustes ya pendientes de la v3 (documentados en el plan anterior) **más** los hallazgos nuevos de esta auditoría (comentados inline donde corresponde).

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
create table viajes (
  id uuid primary key default gen_random_uuid(),
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
-- Ajuste v4 (pendiente #5): dni -> tipo_documento + numero_documento, para
-- turistas extranjeros con pasaporte (Turismo internacional). app.js ya
-- carga pasajeroTipoDocumento/responsableTipoDocumento en el objeto de
-- ficha en memoria hoy (se usa para el PDF) - esto solo formaliza en el
-- storage lo que el frontend ya modela.
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

create table responsables (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo_documento text not null default 'DNI',
  numero_documento text,
  telefono text,
  email text,
  cuil_cuit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tipo_documento, numero_documento)
);
create trigger trg_responsables_updated_at before update on responsables
  for each row execute function set_updated_at();
-- NOTA: numero_documento nullable pero UNIQUE junto a tipo_documento -
-- Postgres permite múltiples NULL en una unique multi-columna. Si no hay
-- documento cargado, lib/db.js debe intentar un match blando por
-- telefono+email+nombre normalizado y marcarlo "posible coincidencia" para
-- revisión manual - nunca bloquear automáticamente.

-- ============ GRUPOS / CONTRATOS / PASAJEROS ============

create table grupos (
  id uuid primary key default gen_random_uuid(),
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
create index grupos_colegio_idx on grupos (colegio_id);
create index grupos_viaje_idx on grupos (viaje_id);
create trigger trg_grupos_updated_at before update on grupos
  for each row execute function set_updated_at();

-- viaje_id directo y obligatorio (permite Turismo sin grupo escolar);
-- grupo_id queda opcional.
create table contratos (
  id uuid primary key default gen_random_uuid(),
  codigo_contrato text not null unique,
  viaje_id uuid not null references viajes(id) on delete restrict,
  grupo_id uuid references grupos(id) on delete restrict,
  estado text not null default 'borrador'
    check (estado in ('activo','borrador','inactivo')),
  fecha_creacion date not null default current_date,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contratos_viaje_idx on contratos (viaje_id);
create index contratos_grupo_idx on contratos (grupo_id);
create index contratos_estado_idx on contratos (estado);
create trigger trg_contratos_updated_at before update on contratos
  for each row execute function set_updated_at();

-- pasajeros = una PARTICIPACIÓN de una persona en un viaje puntual. Único
-- (persona_id, viaje_id): la misma persona no se anota dos veces a la
-- MISMA salida, pero sí puede repetirse en viajes distintos.
create table pasajeros (
  id uuid primary key default gen_random_uuid(),
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
-- Instrumentar el paso previo (colegio+curso resueltos, sin ficha enviada
-- todavía) queda para una v5 si el negocio pide medir abandono del embudo.
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
-- pero que HOY NUNCA llegan al servidor (SCHEMA.FICHAS_ADHESION actual no
-- los tiene). Persistirlos es funcionalidad nueva, no migración de datos
-- existentes - no hay domicilios/firmas reales guardadas hoy para migrar.
create table fichas_adhesion (
  id uuid primary key default gen_random_uuid(),
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

  -- Ajuste v4 (pendiente #2): CHECKs legales - no se puede aprobar sin
  -- aceptar condiciones, y no se puede aprobar sin firma real salvo
  -- excepción explícita marcada por un admin.
  check (estado_revision <> 'aprobada' or acepta_condiciones = true),
  check (estado_revision <> 'aprobada' or firma_storage_path is not null or aprobado_con_excepcion = true)
);
create index fichas_estado_revision_idx on fichas_adhesion (estado_revision);
create index fichas_dni_idx on fichas_adhesion (pasajero_numero_documento);
create index fichas_nombre_idx on fichas_adhesion (lower(pasajero_nombre));
create index fichas_created_idx on fichas_adhesion (created_at);
create trigger trg_fichas_updated_at before update on fichas_adhesion
  for each row execute function set_updated_at();

-- ============ DOCUMENTOS (genérico, polimórfico — trade-off documentado) ============
-- 100% funcionalidad nueva: hoy no existe ningún upload de archivo en el
-- sistema (se buscó explícitamente en app.js, no hay). Postgres no puede
-- validar un FK real cruzando entidad_tipo + entidad_id - lib/db.js DEBE
-- confirmar que entidad_id existe en la tabla que indica entidad_tipo
-- antes de insertar acá.
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
-- habla con Postgres es server.js con la service role key (que ignora RLS
-- por diseño de Supabase). RLS acá es defensa en profundidad: si alguna
-- vez se expone una anon key al navegador por error, deny-by-default
-- significa que esa key no puede leer/escribir NADA hasta que se agregue
-- una policy explícita a propósito. No se planea usar Supabase Auth ni
-- anon key desde el navegador en esta migración (ver sección 5).
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
alter table config enable row level security;
alter table admin_usuarios enable row level security;
alter table eventos_administrativos enable row level security;
```

### `supabase/migrations/0002_pagos_futuro.sql` (diseñado, NO aplicado)

Sin cambios respecto a v2/v3: `cuotas`/`pagos` referenciando `pasajeros(id)`/`contratos(id)`, mismos estados normalizados a lowercase. Confirmado en esta auditoría que `PAGOS`/`CUOTAS` no tienen escritura habilitada hoy (`WRITE_ALLOWED` en `server.js`) — sigue sin ser prioridad.

### Política de retención

- No hay `DELETE` físico por defecto en ninguna tabla con datos personales (hay menores de edad de por medio).
- Los estados existentes (`baja`, `cancelada`, `rechazada`, `duplicada`) son el mecanismo de baja lógica.
- Documentos siempre privados, acceso solo vía URL firmada de corta duración generada por `server.js`.
- Un borrado o exportación real de los datos de una persona puntual es una operación manual, a pedido explícito del cliente — nunca un proceso automático programado.

### Storage: buckets y convención de paths

- Dos buckets privados: `documentos` y `firmas`. Nunca públicos, nunca accedidos con anon key desde el navegador.
- Convención de `storage_path`: `{entidad_tipo}/{entidad_id}/{tipo_documento}-{timestamp}.{ext}` (ej. `ficha_adhesion/3f9.../firma-1721490000.png`). **El path usa el UUID de la entidad, nunca el DNI/nombre** — si un path se llega a loguear en algún lado, no expone PII por sí solo (el DNI queda solo en la fila de la tabla, protegida por RLS/service-role).
- URLs firmadas se generan al vuelo desde `server.js` con la service role key, con expiración corta (ej. 5-10 minutos), nunca se persisten.

---

## 5. Cambios de backend necesarios

### 5.1 Dependencias nuevas (la primera vez que este proyecto suma una)

- **`pg`** (node-postgres): único driver realista para Postgres desde Node — no hay forma stdlib de hacerlo, y es necesario para transacciones reales (ej. aprobar ficha → crear pasajero de forma atómica). Conexión vía `DATABASE_URL`/`SUPABASE_DB_URL` (pooler de Supabase, modo transacción).
- **Storage: sin SDK nuevo.** Se usa `fetch` directo contra la API REST de Supabase Storage (mismo patrón que `server.js` ya usa para firmar JWT de Google Sheets) — evita sumar `@supabase/supabase-js` completo cuando solo hace falta subir/firmar URLs de un par de buckets.

### 5.2 Endpoints que deben conservar interfaz (no romper el frontend)

- `GET/POST /api/google-sheets?sheet=NOMBRE` — **se mantiene como está** (mismo shape de payload: `{ok, sheet, rows}` en GET; `{sheet, rows, deleteIds}` en POST). Por dentro, `handleSheets()` deja de llamar a `sheetsRequest()`/sheets.googleapis.com y llama a `lib/db.js`, que traduce entre la forma "hoja plana" que `app.js` espera y las tablas relacionales reales. Esto es lo que permite avanzar sin tocar ni una línea de `app.js` en las fases 1-4.
- `GET /api/admin/me`, `POST /api/admin/login`, `POST /api/admin/logout` — sin cambios, siguen siendo sesión en memoria + `EAA_ADMIN_PASSWORD`/`EAA_AGENCIA_PASSWORD`. No se introduce Supabase Auth (documentado también en el DDL: `admin_usuarios` sigue sin contraseñas).
- Nuevo (Fase 5, no antes): endpoint para subir documento/firma — puede ser una extensión del POST de `FICHAS_ADHESION` (aceptar un campo de imagen en base64 o un endpoint separado `POST /api/documentos`) que sube a Storage y guarda `storage_path`.

### 5.3 `lib/db.js` — responsabilidades de la capa de aplicación (no son constraints de DB)

- **Traducción hoja↔tabla**: reconstruir el árbol grupo+pasajeros anidado que `app.js` espera al leer `GRUPOS`/`PASAJEROS`, igual que hace `applyGoogleSheetsRows()` hoy — pero leyendo de tablas relacionales reales en vez de dos hojas planas.
- **Resolución de colegio por nombre**: al recibir un `colegio` de texto (creación de grupo/contrato), buscar en `colegios` por `lower(nombre)` exacto primero; si no existe, crearlo. No usar el slug derivado actual (`adminColegioId`) como identidad real — pasa a ser solo cosmético.
- **Matching difuso de colegio para Inscripción pública**: portar `resolveInscripcionContract()`/`schoolSimilarityScore()` (Levenshtein) a `lib/db.js` server-side, operando sobre `colegios.nombre` + `contratos`/`grupos` reales. Es lógica de negocio existente que hay que preservar, no simplificar.
- **DNI/documento**: normalizar a solo dígitos reutilizando la misma lógica de `normalizeFichaDni()` (ya existe en `app.js`, portar tal cual, no reinventar). Teléfono normalizado a solo dígitos. Email `trim()`+`lowercase()` siempre antes de guardar/comparar.
- **Responsable sin documento**: match blando por teléfono+email+nombre normalizado, marcado "posible coincidencia", nunca bloqueado automáticamente.
- **Inscripción duplicada**: búsqueda advisory por `persona_id`+`viaje_id` antes de insertar, sin bloquear.
- **`documentos` polimórfico**: confirmar que `entidad_id` existe en la tabla correspondiente a `entidad_tipo` antes de insertar (compensa la falta de FK real).
- **Transacción de aprobación de ficha**: `BEGIN` → crear/actualizar `pasajero` (y `persona` si no existía) → actualizar `fichas_adhesion.estado_revision = 'aprobada'` → insertar en `eventos_administrativos` → `COMMIT`. Si cualquier paso falla, rollback completo — resuelve el riesgo #1 de raíz.
- **Auditoría**: insertar una fila en `eventos_administrativos` en cada mutación relevante desde el admin (crear/editar pasajero, aprobar/rechazar ficha, editar contrato, etc.), con `actor_username` tomado de la sesión actual.

### 5.4 `lib/localDevStore.js`

Mismo shape de interfaz que `lib/db.js` (`readSheet`/`writeSheet` o equivalente), respaldado por un store en memoria (o JSON en disco para persistir entre reinicios locales). Reemplaza el comportamiento actual de "sin credenciales → cae a datos demo" sin romperlo — `server.js` elige entre `lib/db.js` (si hay `DATABASE_URL`) y `lib/localDevStore.js` (si no) al arrancar.

---

## 6. Checklist de pruebas end-to-end antes de aprobar implementación

A correr contra un proyecto Supabase de **staging**, nunca contra producción directamente:

**Esquema**
- [ ] `0001_init.sql` corre sin errores en un proyecto Supabase limpio.
- [ ] Los triggers de `updated_at` disparan correctamente en un `UPDATE` de prueba en cada tabla que los tiene.
- [ ] `unique(persona_id, viaje_id)` en `pasajeros`: permite la misma persona en dos viajes distintos, rechaza la misma persona dos veces en el mismo viaje.
- [ ] Un contrato de Turismo se puede crear con `grupo_id = null`.
- [ ] Los CHECK legales de `fichas_adhesion` bloquean `estado_revision = 'aprobada'` sin `acepta_condiciones = true`, y sin firma salvo `aprobado_con_excepcion = true`.
- [ ] `inscripciones` rechaza `estado = 'duplicada'` sin `duplicada_de_id`.

**Compatibilidad de endpoints**
- [ ] `GET /api/google-sheets?sheet=GRUPOS` (y CONTRATOS/PASAJEROS/FICHAS_ADHESION/TURISMO) devuelve el mismo shape de filas que hoy devuelve Sheets, sin cambiar `app.js`.
- [ ] `POST /api/google-sheets` con `sheet=FICHAS_ADHESION` sin sesión (público) sigue funcionando con las mismas reglas (1 fila, id generado server-side, rate limit).
- [ ] Sesión de admin (`/api/admin/login`/`me`/`logout`) sin cambios de comportamiento.

**Flujo funcional (el corazón del sistema)**
- [ ] Inscripción pública: colegio tipeado con errores menores de tipeo sigue encontrando el contrato correcto (matching difuso preservado).
- [ ] Envío de ficha de adhesión pública guarda ahora domicilio completo, tipo/número de documento y firma (antes se perdían — confirmar que llegan reales a la base).
- [ ] Aprobar una ficha crea el pasajero Y actualiza el estado de la ficha en la misma operación; forzar un fallo a mitad de camino (ej. cortar conexión) y confirmar que NO queda un pasajero huérfano sin ficha aprobada (prueba directa del fix de atomicidad).
- [ ] DNI duplicado: crear un pasajero con DNI ya existente en otro grupo/viaje distinto debe seguir siendo detectado (a nivel base ahora, no solo JS).
- [ ] Navegar entre secciones del admin (Fichas → Pasajeros → Grupos) no pierde datos reales recién creados (repetir la prueba del bug de hidratación del 18/07, ahora contra Postgres).
- [ ] Turismo: crear/editar/publicar un paquete sigue funcionando igual desde `/admin/turismo`.
- [ ] Documentos: subir un archivo de prueba, confirmar que el path guardado no contiene DNI/nombre, y que la URL firmada generada expira.

**Seguridad**
- [ ] RLS deny-by-default confirmado: con la anon key (sin service role), ningún `select`/`insert` funciona en ninguna tabla.
- [ ] Solo `server.js` tiene la service role key (variable de entorno server-side, nunca en código ni en el bundle del navegador).
- [ ] Repetir el smoke test de seguridad ya hecho antes (PII de menores no accesible sin sesión) contra los nuevos endpoints.

**Rendimiento/carga**
- [ ] Con datos backfilleados reales de producción, los índices de búsqueda del admin (nombre, DNI, estado+fecha) responden razonablemente rápido en las pantallas de Fichas/Pasajeros.

---

## Qué sigue

Este documento reemplaza la v3 como referencia vigente. Falta: revisión de Wilson, y luego confirmación explícita antes de tocar cualquier archivo real del proyecto (mismo criterio que las rondas anteriores — "corregí el documento, no toqués código todavía" hasta nueva orden).
