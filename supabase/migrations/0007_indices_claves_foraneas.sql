-- El Ángel Azul — índices para las claves foráneas sin índice que marcó el
-- advisor de rendimiento de Supabase el 27/11/2026 (unindexed_foreign_keys).
-- Sin ellos, borrar o filtrar por la tabla referenciada recorre la tabla hija
-- entera; con la base vacía no se nota, con miles de inscripciones sí.
-- Los índices "sin uso" que también marca el advisor son normales con la base
-- sin tráfico: no se tocan.
create index if not exists inscripciones_grupo_idx on inscripciones (grupo_id);
create index if not exists inscripciones_contrato_idx on inscripciones (contrato_id);
create index if not exists inscripciones_pasajero_idx on inscripciones (pasajero_id);
create index if not exists inscripciones_plan_pago_idx on inscripciones (plan_pago_id);
create index if not exists inscripciones_duplicada_de_idx on inscripciones (duplicada_de_id);
create index if not exists pasajeros_viaje_idx on pasajeros (viaje_id);
create index if not exists pasajeros_plan_pago_idx on pasajeros (plan_pago_id);
create index if not exists eventos_actor_idx on eventos_administrativos (actor_id);
