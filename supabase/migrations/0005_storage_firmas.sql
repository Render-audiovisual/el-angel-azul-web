-- Bucket privado "fichas" para las firmas (PNG). Sin políticas: solo accede el
-- servidor con la service role key. firma_storage_path pasa a guardar la ruta
-- ("firmas/<uuid>.png"); las fichas anteriores conservan la data URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fichas', 'fichas', false, 262144, array['image/png'])
on conflict (id) do nothing;

alter table public.fichas_adhesion alter column firma_bucket set default 'fichas';
