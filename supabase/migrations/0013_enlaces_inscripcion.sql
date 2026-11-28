-- Un enlace compartido identifica la ficha del contrato. Nunca autentica
-- personas ni permite leer contratos privados, fichas o cuentas.
alter table contratos add column inscripcion_codigo uuid not null default gen_random_uuid();
alter table contratos add column inscripcion_abierta boolean not null default true;
create unique index contratos_inscripcion_codigo_uk on contratos(inscripcion_codigo);
