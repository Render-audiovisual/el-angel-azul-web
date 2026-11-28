-- Accesos individuales, sin contraseñas ni tokens en texto plano en la base.
-- No modifica fichas, pasajeros o responsables existentes. Solo pruebas locales.
create table portal_identidades (
 id uuid primary key default gen_random_uuid(),
 persona_id uuid references personas(id) on delete restrict,
 responsable_id uuid references responsables(id) on delete restrict,
 created_at timestamptz not null default now(),
 check ((persona_id is not null)::int + (responsable_id is not null)::int = 1)
);
create unique index portal_identidades_persona_uk on portal_identidades(persona_id) where persona_id is not null;
create unique index portal_identidades_responsable_uk on portal_identidades(responsable_id) where responsable_id is not null;
create table portal_invitaciones (
 id uuid primary key default gen_random_uuid(),
 identidad_id uuid not null references portal_identidades(id) on delete restrict,
 pasajero_id uuid not null references pasajeros(id) on delete restrict,
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz not null,
 usada_at timestamptz,
 revocada_at timestamptz,
 actor_username text not null,
 created_at timestamptz not null default now()
);
create index portal_invitaciones_identidad_idx on portal_invitaciones(identidad_id);
create index portal_invitaciones_pasajero_idx on portal_invitaciones(pasajero_id);
create table portal_sesiones (
 id uuid primary key default gen_random_uuid(),
 identidad_id uuid not null references portal_identidades(id) on delete restrict,
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz not null,
 revocada_at timestamptz,
 created_at timestamptz not null default now()
);
create index portal_sesiones_identidad_idx on portal_sesiones(identidad_id);
create index portal_sesiones_expiracion_idx on portal_sesiones(expires_at);
alter table portal_identidades enable row level security;
alter table portal_invitaciones enable row level security;
alter table portal_sesiones enable row level security;
