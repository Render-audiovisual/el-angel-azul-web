-- El Ángel Azul — esquema inicial Supabase/Postgres
-- Corresponde al DDL aprobado en contexto proyecto/plan-base-de-datos-el-angel-azul-v5.md
-- No se migran datos viejos acá - solo crea la estructura. Deny-by-default en RLS.

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

create table colegios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index colegios_nombre_uk on colegios (lower(nombre));
create trigger trg_colegios_updated_at before update on colegios
  for each row execute function set_updated_at();

-- legacy_id: PERMANENTE, no solo para el backfill. Los paquetes de Turismo
-- nuevos siguen generando su id en el navegador (`viaje-${Date.now()}`,
-- app.js:6560) para siempre - ver plan v5, riesgo #7.
create table viajes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  slug text unique,
  categoria text not null check (categoria in ('estudiantil','turismo','mixto')),
  nivel text,
  destino text not null,
  titulo text not null,
  anio integer,
  fecha_salida date,
  fecha_regreso date,
  salida_garantizada boolean not null default false,
  estado text not null default 'borrador'
    check (estado in ('borrador','revision','activo','inactivo')),
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
  updated_at timestamptz not null default now()
);
create unique index responsables_doc_uk on responsables (tipo_documento, numero_documento)
  where numero_documento is not null;
create trigger trg_responsables_updated_at before update on responsables
  for each row execute function set_updated_at();

-- ============ GRUPOS / CONTRATOS / PASAJEROS ============

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

create table pasajeros (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  persona_id uuid not null references personas(id) on delete restrict,
  viaje_id uuid not null references viajes(id) on delete restrict,
  grupo_id uuid references grupos(id) on delete restrict,
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

create table inscripciones (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete restrict,
  viaje_id uuid not null references viajes(id) on delete restrict,
  grupo_id uuid references grupos(id) on delete restrict,
  contrato_id uuid references contratos(id) on delete restrict,
  pasajero_id uuid references pasajeros(id) on delete restrict,
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

-- ============ FICHAS DE ADHESIÓN (1:1 con inscripción) ============

create table fichas_adhesion (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  inscripcion_id uuid not null unique references inscripciones(id) on delete restrict,

  pasajero_nombre text not null,
  pasajero_tipo_documento text not null default 'DNI',
  pasajero_numero_documento text not null,
  pasajero_nacimiento date,
  pasajero_sexo text,

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

-- ============ DOCUMENTOS (genérico, polimórfico) ============

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
-- El único cliente que habla con Postgres es server.js con la service role
-- key (bypassea RLS por diseño de Supabase). RLS acá es defensa en
-- profundidad si alguna vez se expone una anon key al navegador por error.
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
