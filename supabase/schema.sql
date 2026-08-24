-- Ezmel — esquema inicial para Supabase (Legajos de Cliente)
-- Correr en el SQL Editor del proyecto de Supabase.

create table if not exists public.legajos (
  id uuid primary key,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  -- Todos los campos del formulario (ver lib/types/legajo.ts) se guardan como jsonb
  -- para no tener que migrar la tabla cada vez que cambia el formulario.
  data jsonb not null,
  file_names jsonb not null default '{}'::jsonb
);

create table if not exists public.legajo_files (
  id uuid primary key default gen_random_uuid(),
  legajo_id uuid not null references public.legajos (id) on delete cascade,
  slot_key text not null, -- dni | haberes | servicios (ver FILE_CATEGORIES en lib/types/legajo.ts)
  file_name text not null,
  storage_path text not null,
  observaciones text not null default '',
  created_at timestamptz not null default now()
);

alter table public.legajos enable row level security;
alter table public.legajo_files enable row level security;

-- v1: sólo hay rol admin (usuarios autenticados). Se puede restringir más
-- adelante cuando se agregue el rol "usuario".
create policy "Admins pueden leer legajos" on public.legajos
  for select using (auth.role() = 'authenticated');
create policy "Admins pueden crear legajos" on public.legajos
  for insert with check (auth.role() = 'authenticated');

create policy "Admins pueden leer archivos de legajos" on public.legajo_files
  for select using (auth.role() = 'authenticated');
create policy "Admins pueden crear archivos de legajos" on public.legajo_files
  for insert with check (auth.role() = 'authenticated');

-- Storage: crear el bucket "legajo-files" (privado) desde el dashboard de
-- Supabase (Storage > New bucket, "Public bucket" desactivado) y aplicar
-- estas policies sobre storage.objects:
--
-- create policy "Admins pueden subir archivos de legajos" on storage.objects
--   for insert with check (bucket_id = 'legajo-files' and auth.role() = 'authenticated');
-- create policy "Admins pueden leer archivos de legajos" on storage.objects
--   for select using (bucket_id = 'legajo-files' and auth.role() = 'authenticated');
