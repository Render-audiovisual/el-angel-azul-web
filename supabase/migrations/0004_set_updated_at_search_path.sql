-- El Ángel Azul — endurecer set_updated_at (16/09/2026)
-- El linter de Supabase marca las funciones sin search_path fijo: si alguien
-- crea un objeto con el mismo nombre en un esquema anterior del search_path,
-- la función podría resolverlo a ese objeto. La función solo toca NEW, así
-- que fijarlo en pg_catalog no cambia su comportamiento.
alter function public.set_updated_at() set search_path = pg_catalog;
