-- Una solicitud pública no concede pertenencia ni acceso privado.
alter table fichas_tutor
 add column pasajero_id uuid references pasajeros(id) on delete restrict,
 add column vinculo_verificado_por text,
 add column vinculo_verificado_at timestamptz;
create index fichas_tutor_pasajero_idx on fichas_tutor(pasajero_id);
create unique index fichas_tutor_id_pasajero_uk on fichas_tutor(id,pasajero_id);
alter table pasajero_responsables add column ficha_tutor_id uuid;
create unique index pasajero_responsable_principal_uk on pasajero_responsables(pasajero_id) where es_principal;
alter table pasajero_responsables add constraint responsable_ficha_scope_fk
 foreign key(ficha_tutor_id,pasajero_id) references fichas_tutor(id,pasajero_id) on delete restrict;
create unique index responsables_ficha_tutor_uk on pasajero_responsables(ficha_tutor_id,pasajero_id);
alter table fichas_tutor add constraint tutor_revisado_vinculado_ck check (
 estado_revision<>'revisada' or (pasajero_id is not null and vinculo_verificado_por is not null and vinculo_verificado_at is not null)
) not valid;
-- Preserva solicitudes y vínculos heredados. Requieren revisión autorizada;
-- no se revocan ni se consideran verificados automáticamente al migrar.
drop index fichas_tutor_vigente_uk;
create unique index fichas_tutor_vigente_uk on fichas_tutor(pasajero_numero_documento,numero_documento,pasajero_id) nulls not distinct where estado_revision<>'rechazada';
