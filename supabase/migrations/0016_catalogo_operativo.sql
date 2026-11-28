alter table viajes_turismo_detalle
 add column alojamiento text not null default '',
 add column transporte text not null default '',
 add column regimen_comidas text not null default '',
 add column disponibilidad text not null default 'a_confirmar' check(disponibilidad in ('a_confirmar','disponible','sin_cupo')),
 add column cupos integer check(cupos>=0),
 add column promocion text not null default '',
 add column video_url text not null default '',
 add column archivado boolean not null default false;
create table catalogo_multimedia (
 id uuid primary key,
 storage_path text not null unique check(storage_path ~ '^fotos/[a-f0-9-]+/[a-f0-9-]+\.(png|jpg)$'),
 nombre text not null,
 mime_type text not null check(mime_type in ('image/png','image/jpeg')),
 tamano_bytes integer not null check(tamano_bytes between 1 and 5242880),
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 actor_username text not null,
 created_at timestamptz not null default now()
);
create table catalogo_paquete_medios (
 viaje_id uuid not null references viajes(id) on delete cascade,
 medio_id uuid not null references catalogo_multimedia(id) on delete restrict,
 primary key(viaje_id,medio_id)
);
create index catalogo_medios_referencia_idx on catalogo_paquete_medios(medio_id);
alter table catalogo_multimedia enable row level security;
alter table catalogo_paquete_medios enable row level security;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('catalogo','catalogo',false,5242880,array['image/png','image/jpeg']) on conflict(id) do nothing;
-- Las imágenes se sirven por API solamente si el paquete está publicado,
-- o con una sesión administrativa. Un borrador no publica sus archivos.
