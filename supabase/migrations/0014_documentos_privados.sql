-- Amplía la tabla existente; no reemplaza ni interpreta archivos heredados.
alter table documentos
 add column contrato_id uuid references contratos(id) on delete restrict,
 add column pasajero_id uuid references pasajeros(id) on delete restrict,
 add column nombre_original text,
 add column mime_type text,
 add column tamano_bytes integer,
 add column sha256 text,
 add column uploaded_actor text,
 add column visible_familia boolean not null default false;
create index documentos_contrato_idx on documentos(contrato_id);
create index documentos_pasajero_idx on documentos(pasajero_id);
create unique index documentos_objeto_privado_uk on documentos(storage_bucket,storage_path) where nombre_original is not null;
alter table documentos add constraint documentos_archivo_completo_ck check (
 (num_nonnulls(nombre_original,mime_type,tamano_bytes,sha256,uploaded_actor)=0 and contrato_id is null and pasajero_id is null) or (
  num_nonnulls(nombre_original,mime_type,tamano_bytes,sha256,uploaded_actor)=5 and
  length(nombre_original) between 1 and 200 and
  mime_type in ('application/pdf','image/png','image/jpeg') and
  tamano_bytes between 1 and 5242880 and sha256 ~ '^[a-f0-9]{64}$' and
  uploaded_actor is not null and storage_bucket='documentos' and
  storage_path ~ '^privados/[a-f0-9-]+/[a-f0-9-]+\.(pdf|png|jpg)$' and
  ((contrato_id is not null and pasajero_id is null and entidad_tipo='contrato' and entidad_id=contrato_id and tipo_documento='contrato_firmado' and mime_type='application/pdf') or
   (pasajero_id is not null and contrato_id is null and entidad_tipo='pasajero' and entidad_id=pasajero_id and tipo_documento<>'contrato_firmado'))
 )
);
create function proteger_archivo_documento() returns trigger language plpgsql set search_path=public as $$
begin
 if old.nombre_original is not null and
  (new.id,new.entidad_tipo,new.entidad_id,new.contrato_id,new.pasajero_id,new.tipo_documento,new.storage_bucket,new.storage_path,new.nombre_original,new.mime_type,new.tamano_bytes,new.sha256,new.uploaded_actor,new.uploaded_at)
  is distinct from
  (old.id,old.entidad_tipo,old.entidad_id,old.contrato_id,old.pasajero_id,old.tipo_documento,old.storage_bucket,old.storage_path,old.nombre_original,old.mime_type,old.tamano_bytes,old.sha256,old.uploaded_actor,old.uploaded_at)
 then raise exception 'El archivo y su pertenencia no se reemplazan. Adjuntá una nueva versión conservando el historial.'; end if;
 return new;
end; $$;
create trigger documentos_archivo_inmutable before update on documentos for each row execute function proteger_archivo_documento();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('documentos','documentos',false,5242880,array['application/pdf','image/png','image/jpeg'])
on conflict(id) do nothing;
-- Si existía un bucket público con ese nombre se debe revisar antes de activar
-- el servicio; no se altera silenciosamente la configuración de otro sistema.
