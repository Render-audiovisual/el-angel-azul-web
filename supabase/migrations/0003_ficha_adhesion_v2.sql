-- El Ángel Azul — Ficha de Adhesión v2 (15/09/2026)
-- Ver docs/superpowers/specs/2026-09-15-ficha-adhesion-design.md §3.
-- La base solo tenía datos de prueba: inscripciones y fichas_adhesion se
-- recrean con los obligatorios exigidos en la propia base.
-- grupos.curso guarda el Grado/Año ("5°") y grupos.division la división;
-- el Curso (Primaria/Secundaria) es viajes.nivel.

drop table if exists fichas_adhesion;
drop table if exists inscripciones;

-- ============ CATÁLOGO ============
alter table colegios
  add column activo boolean not null default true,
  add column provincia text,
  add column localidad text,
  add column codigo_oficial text;
create unique index colegios_codigo_oficial_uk on colegios (codigo_oficial) where codigo_oficial is not null;
create index colegios_activo_idx on colegios (activo);

alter table personas add column apellido text;
alter table responsables add column apellido text;

create table planes_pago (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos(id) on delete restrict,
  nombre text not null check (length(btrim(nombre)) >= 2),
  cuotas integer not null check (cuotas between 1 and 18),
  descripcion text,
  activo boolean not null default true,
  orden integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index planes_pago_contrato_idx on planes_pago (contrato_id);
create trigger trg_planes_pago_updated_at before update on planes_pago
  for each row execute function set_updated_at();

alter table pasajeros add column plan_pago_id uuid references planes_pago(id) on delete restrict;

-- ============ INSCRIPCIONES ============
create table inscripciones (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete restrict,
  viaje_id uuid not null references viajes(id) on delete restrict,
  colegio_id uuid references colegios(id) on delete restrict,
  colegio_texto text,
  nivel text not null check (nivel in ('Primaria', 'Secundaria')),
  grado text not null check (grado ~ '^[1-7]°$'),
  division text not null check (division ~ '^[A-Z0-9]{1,3}$'),
  grupo_id uuid references grupos(id) on delete restrict,
  contrato_id uuid references contratos(id) on delete restrict,
  pasajero_id uuid references pasajeros(id) on delete restrict,
  plan_pago_id uuid references planes_pago(id) on delete restrict,
  estado text not null default 'ficha_enviada'
    check (estado in ('iniciada','ficha_enviada','duplicada','cancelada')),
  duplicada_de_id uuid references inscripciones(id) on delete restrict,
  origen text not null default 'web'
    check (origen in ('web','whatsapp','admin_manual','campana','referido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (colegio_id is not null or length(btrim(coalesce(colegio_texto, ''))) >= 3),
  check (estado <> 'duplicada' or duplicada_de_id is not null)
);
create index inscripciones_persona_idx on inscripciones (persona_id);
create index inscripciones_viaje_idx on inscripciones (viaje_id);
create index inscripciones_colegio_idx on inscripciones (colegio_id);
create index inscripciones_estado_created_idx on inscripciones (estado, created_at);
create trigger trg_inscripciones_updated_at before update on inscripciones
  for each row execute function set_updated_at();

-- ============ FICHAS DE ADHESIÓN (PAX) ============
create table fichas_adhesion (
  id uuid primary key default gen_random_uuid(),
  inscripcion_id uuid not null unique references inscripciones(id) on delete restrict,

  pasajero_nombre text not null check (length(btrim(pasajero_nombre)) >= 2),
  pasajero_apellido text not null check (length(btrim(pasajero_apellido)) >= 2),
  pasajero_tipo_documento text not null check (pasajero_tipo_documento in ('DNI','Pasaporte','LC','LE')),
  pasajero_numero_documento text not null check (pasajero_numero_documento ~ '^[A-Z0-9]{6,15}$'),
  pasajero_nacimiento date not null,
  pasajero_sexo text not null,

  responsable_nombre text not null check (length(btrim(responsable_nombre)) >= 2),
  responsable_apellido text not null check (length(btrim(responsable_apellido)) >= 2),
  responsable_tipo_documento text not null check (responsable_tipo_documento in ('DNI','Pasaporte','LC','LE')),
  responsable_numero_documento text not null check (responsable_numero_documento ~ '^[A-Z0-9]{6,15}$'),
  responsable_nacimiento date not null,
  responsable_parentesco text not null,
  responsable_cuil_cuit text not null check (responsable_cuil_cuit ~ '^[0-9]{11}$'),
  responsable_email text not null check (responsable_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  responsable_celular text not null check (responsable_celular ~ '^[0-9]{10,13}$'),
  responsable_telefono text,

  domicilio_calle text not null check (length(btrim(domicilio_calle)) >= 2),
  domicilio_numero text not null check (domicilio_numero ~ '^([0-9]{1,6}|S/N)$'),
  domicilio_piso text,
  domicilio_departamento text,
  domicilio_barrio text,
  domicilio_localidad text not null check (length(btrim(domicilio_localidad)) >= 2),
  domicilio_provincia text not null,
  domicilio_codigo_postal text not null check (domicilio_codigo_postal ~ '^([0-9]{4}|[A-Z][0-9]{4}[A-Z]{3})$'),

  acepta_condiciones boolean not null check (acepta_condiciones = true),
  firma_storage_path text not null,
  firma_bucket text not null default 'firmas',

  estado_revision text not null default 'pendiente'
    check (estado_revision in ('pendiente','revisada','observada','duplicada','aprobada','rechazada')),
  documentacion_estado text not null default 'pendiente',
  ficha_medica_estado text not null default 'pendiente',
  autorizacion_estado text not null default 'pendiente',
  motivo_rechazo text,
  observaciones text,

  email_estado text not null default 'pendiente'
    check (email_estado in ('pendiente','enviado','error','sin_configurar')),
  email_enviado_at timestamptz,
  email_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fichas_estado_revision_idx on fichas_adhesion (estado_revision);
create index fichas_dni_idx on fichas_adhesion (pasajero_numero_documento);
create index fichas_apellido_idx on fichas_adhesion (lower(pasajero_apellido));
create index fichas_created_idx on fichas_adhesion (created_at);
create trigger trg_fichas_updated_at before update on fichas_adhesion
  for each row execute function set_updated_at();

-- ============ FICHAS DE TUTOR (formulario corto) ============
create table fichas_tutor (
  id uuid primary key default gen_random_uuid(),
  pasajero_nombre text not null check (length(btrim(pasajero_nombre)) >= 2),
  pasajero_apellido text not null check (length(btrim(pasajero_apellido)) >= 2),
  pasajero_numero_documento text not null check (pasajero_numero_documento ~ '^[0-9]{7,8}$'),
  nombre text not null check (length(btrim(nombre)) >= 2),
  apellido text not null check (length(btrim(apellido)) >= 2),
  tipo_documento text not null check (tipo_documento in ('DNI','Pasaporte','LC','LE')),
  numero_documento text not null check (numero_documento ~ '^[A-Z0-9]{6,15}$'),
  cuil_cuit text not null check (cuil_cuit ~ '^[0-9]{11}$'),
  celular text not null check (celular ~ '^[0-9]{10,13}$'),
  email text not null check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  parentesco text not null,
  acepta_condiciones boolean not null check (acepta_condiciones = true),
  estado_revision text not null default 'pendiente'
    check (estado_revision in ('pendiente','revisada','observada','rechazada')),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fichas_tutor_pasajero_dni_idx on fichas_tutor (pasajero_numero_documento);
create trigger trg_fichas_tutor_updated_at before update on fichas_tutor
  for each row execute function set_updated_at();

alter table planes_pago enable row level security;
alter table inscripciones enable row level security;
alter table fichas_adhesion enable row level security;
alter table fichas_tutor enable row level security;
