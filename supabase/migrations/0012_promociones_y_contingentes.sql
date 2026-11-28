-- Distinguir pertenencia académica y salida operativa. Sin clasificar filas viejas.
create table promociones (
 id uuid primary key default gen_random_uuid(),
 colegio_id uuid not null references colegios(id) on delete restrict,
 nivel text not null check(nivel in ('Primaria','Secundaria')),
 anio_egreso integer not null check(anio_egreso between 1900 and 9999),
 nombre text not null check(length(btrim(nombre)) between 2 and 150),
 activo boolean not null default true,
 observaciones text not null default '',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(id,colegio_id)
);
create unique index promociones_identidad_uk on promociones(colegio_id,nivel,anio_egreso,lower(nombre));
create trigger promociones_updated_at before update on promociones for each row execute function set_updated_at();
alter table grupos add column promocion_id uuid;
alter table grupos add constraint grupo_promocion_colegio_fk foreign key(promocion_id,colegio_id) references promociones(id,colegio_id) on delete restrict;
create index grupos_promocion_idx on grupos(promocion_id,colegio_id);
alter table grupos add constraint grupos_id_viaje_uk unique(id,viaje_id);
create table contingentes (
 id uuid primary key default gen_random_uuid(),
 viaje_id uuid not null references viajes(id) on delete restrict,
 nombre text not null check(length(btrim(nombre)) between 2 and 150),
 fecha_salida date,fecha_regreso date,
 activo boolean not null default true,
 observaciones text not null default '',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(id,viaje_id),check(fecha_salida is null or fecha_regreso is null or fecha_regreso>=fecha_salida)
);
create index contingentes_viaje_idx on contingentes(viaje_id);
create trigger contingentes_updated_at before update on contingentes for each row execute function set_updated_at();
create table contingente_grupos (
 contingente_id uuid not null,grupo_id uuid not null,viaje_id uuid not null,
 primary key(contingente_id,grupo_id),
 foreign key(contingente_id,viaje_id) references contingentes(id,viaje_id) on delete restrict,
 foreign key(grupo_id,viaje_id) references grupos(id,viaje_id) on delete restrict
);
create index contingente_grupos_grupo_idx on contingente_grupos(grupo_id,viaje_id);
create index contingente_grupos_viaje_idx on contingente_grupos(viaje_id);
alter table pasajeros add column contingente_id uuid;
alter table pasajeros add constraint pasajero_contingente_grupo_fk foreign key(contingente_id,grupo_id) references contingente_grupos(contingente_id,grupo_id) on delete restrict;
alter table pasajeros add constraint pasajero_contingente_con_grupo check(contingente_id is null or grupo_id is not null);
create index pasajeros_contingente_idx on pasajeros(contingente_id,grupo_id);
-- Exigir integridad en altas/cambios nuevos sin alterar ni adivinar datos heredados.
alter table pasajeros add constraint pasajero_grupo_viaje_fk foreign key(grupo_id,viaje_id) references grupos(id,viaje_id) on delete restrict not valid;
alter table contratos add constraint contratos_id_viaje_uk unique(id,viaje_id);
alter table pasajeros add constraint pasajero_contrato_viaje_fk foreign key(contrato_id,viaje_id) references contratos(id,viaje_id) on delete restrict not valid;
alter table planes_pago add constraint planes_id_contrato_uk unique(id,contrato_id);
alter table pasajeros add constraint pasajero_plan_contrato_fk foreign key(plan_pago_id,contrato_id) references planes_pago(id,contrato_id) on delete restrict not valid;
create function validar_nivel_promocion() returns trigger language plpgsql set search_path=public as $$
declare nivel_promocion text; nivel_viaje text;
begin
 if new.promocion_id is null then return new; end if;
 select nivel into nivel_promocion from promociones where id=new.promocion_id;
 select nivel into nivel_viaje from viajes where id=new.viaje_id;
 if lower(coalesce(nivel_promocion,''))<>lower(coalesce(nivel_viaje,'')) then
  raise exception 'La promoción y el grupo deben tener el mismo nivel académico.' using errcode='23514',constraint='grupo_promocion_nivel';
 end if;
 return new;
end $$;
create trigger grupo_promocion_nivel before insert or update of promocion_id,viaje_id on grupos for each row execute function validar_nivel_promocion();
alter table promociones enable row level security;
alter table contingentes enable row level security;
alter table contingente_grupos enable row level security;

alter table pasajeros add constraint pasajero_plan_necesita_contrato check(plan_pago_id is null or contrato_id is not null) not valid;
create function conservar_nivel_promocion() returns trigger language plpgsql set search_path=public as $$
begin
 if exists(select 1 from grupos g join viajes v on v.id=g.viaje_id where g.promocion_id=new.id and lower(coalesce(v.nivel,''))<>lower(new.nivel)) then
  raise exception 'La promoción tiene grupos de otro nivel académico.' using errcode='23514',constraint='grupo_promocion_nivel';
 end if;
 return new;
end $$;
create trigger promocion_nivel_vinculado before update of nivel on promociones for each row execute function conservar_nivel_promocion();
create function conservar_nivel_viaje() returns trigger language plpgsql set search_path=public as $$
begin
 if exists(select 1 from grupos g join promociones pr on pr.id=g.promocion_id where g.viaje_id=new.id and lower(pr.nivel)<>lower(coalesce(new.nivel,''))) then
  raise exception 'El viaje tiene promociones de otro nivel académico.' using errcode='23514',constraint='grupo_promocion_nivel';
 end if;
 return new;
end $$;
create trigger viaje_nivel_vinculado before update of nivel on viajes for each row execute function conservar_nivel_viaje();
create unique index contingentes_identidad_uk on contingentes(viaje_id,lower(nombre),fecha_salida) nulls not distinct;

create index contingente_grupos_salida_viaje_idx on contingente_grupos(contingente_id,viaje_id);
create index pasajeros_grupo_viaje_idx on pasajeros(grupo_id,viaje_id);
create index pasajeros_contrato_viaje_idx on pasajeros(contrato_id,viaje_id);
create index pasajeros_plan_contrato_idx on pasajeros(plan_pago_id,contrato_id);
