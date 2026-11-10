-- =============================================================================
-- Ezmel — esquema de Supabase: multi-tenant, roles y seguridad (RLS)
--
-- Cómo usarlo: SQL Editor del proyecto de Supabase -> New query -> pegar TODO este
-- archivo -> Run. Es idempotente: se puede volver a correr sin romper nada.
-- Después, crear el primer tenant con supabase/seed.sql.
--
-- Modelo:
--   tenants        cada empresa/cliente que usa la app (aislamiento total entre tenants)
--   profiles       1 fila por usuario de auth.users: a qué tenant pertenece y con qué rol
--   invitations    un usuario sólo entra a un tenant si fue invitado (por su email)
--   legajos, legajo_files, contratos   datos del negocio, siempre con tenant_id
--
-- Roles (enum app_role):
--   admin      todo, incluida la gestión de usuarios del tenant
--   operador   crea y consulta legajos/contratos
--   lectura    sólo consulta
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$
begin
  create type public.app_role as enum ('admin', 'operador', 'lectura');
exception
  when duplicate_object then null;
end
$$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  -- Sin tenant ni rol = cuenta creada pero todavía sin acceso (falta invitación).
  tenant_id uuid references public.tenants (id) on delete set null,
  role public.app_role,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_tenant_role_juntos check ((tenant_id is null) = (role is null))
);
create index if not exists profiles_tenant_idx on public.profiles (tenant_id);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  email text not null check (email = lower(trim(email)) and position('@' in email) > 1),
  role public.app_role not null default 'operador',
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null
);
-- Una sola invitación pendiente por email y tenant.
create unique index if not exists invitations_pendiente_unica
  on public.invitations (tenant_id, email) where accepted_at is null;
create index if not exists invitations_email_idx on public.invitations (email) where accepted_at is null;

create table if not exists public.legajos (
  id uuid primary key,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Todos los campos del formulario (ver lib/types/legajo.ts) como jsonb, para no
  -- tener que migrar la tabla cada vez que cambia el formulario.
  data jsonb not null,
  file_names jsonb not null default '{}'::jsonb
);
create index if not exists legajos_tenant_idx on public.legajos (tenant_id, created_at desc);

create table if not exists public.legajo_files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  legajo_id uuid not null references public.legajos (id) on delete cascade,
  slot_key text not null, -- dni | haberes | servicios | transferencias | capturasVarias
  file_name text not null,
  storage_path text not null,
  observaciones text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists legajo_files_legajo_idx on public.legajo_files (legajo_id);

create table if not exists public.contratos (
  id uuid primary key,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Todos los campos del formulario (ver lib/types/contrato.ts) como jsonb.
  datos jsonb not null
);
create index if not exists contratos_tenant_idx on public.contratos (tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (SECURITY DEFINER para poder usarlas dentro de las policies
-- sin que las policies de profiles/tenants se llamen a sí mismas).
-- Devuelven null si el usuario no tiene perfil activo en un tenant activo.
-- ---------------------------------------------------------------------------
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.tenant_id
  from public.profiles p
  join public.tenants t on t.id = p.tenant_id
  where p.id = auth.uid() and p.active and t.active
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  join public.tenants t on t.id = p.tenant_id
  where p.id = auth.uid() and p.active and t.active
$$;

-- ---------------------------------------------------------------------------
-- Alta de usuarios: al crearse (o confirmar su email) un usuario en auth.users se
-- crea su perfil, y si tiene una invitación pendiente para ese email, queda
-- asociado al tenant con el rol invitado.
-- Se exige email confirmado: con Google ya viene confirmado; con email/contraseña
-- hay que activar "Confirm email" en Supabase para que nadie pueda quedarse con la
-- invitación de otro registrando su email sin ser dueño.
-- ---------------------------------------------------------------------------
create or replace function public.claim_invitation(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.invitations%rowtype;
begin
  -- Solo si todavía no tiene tenant (un usuario pertenece a un único tenant).
  if not exists (select 1 from public.profiles where id = p_user_id and tenant_id is null) then
    return;
  end if;

  select * into inv
  from public.invitations
  where email = lower(trim(p_email)) and accepted_at is null
  order by created_at
  limit 1;

  if not found then
    return;
  end if;

  update public.profiles
     set tenant_id = inv.tenant_id, role = inv.role, updated_at = now()
   where id = p_user_id;

  update public.invitations
     set accepted_at = now(), accepted_by = p_user_id
   where id = inv.id;
end
$$;

create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email, updated_at = now();

  if new.email_confirmed_at is not null and new.email is not null then
    perform public.claim_invitation(new.id, new.email);
  end if;

  return new;
end
$$;

drop trigger if exists on_auth_user_changed on auth.users;
create trigger on_auth_user_changed
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute function public.handle_auth_user();

-- ---------------------------------------------------------------------------
-- Funciones de administración
-- ---------------------------------------------------------------------------

-- Crear un tenant y dejar invitado a su primer administrador.
-- SOLO se ejecuta desde el SQL Editor (rol postgres) o con la service_role key;
-- ningún usuario de la app puede crear tenants.
create or replace function public.create_tenant(p_name text, p_slug text, p_admin_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid;
  v_email text := lower(trim(p_admin_email));
  v_user uuid;
begin
  insert into public.tenants (name, slug) values (trim(p_name), lower(trim(p_slug)))
  returning id into v_tenant;

  insert into public.invitations (tenant_id, email, role) values (v_tenant, v_email, 'admin');

  -- Si esa persona ya tiene cuenta confirmada, queda asociada en el acto.
  select id into v_user from auth.users where lower(email) = v_email and email_confirmed_at is not null;
  if v_user is not null then
    perform public.claim_invitation(v_user, v_email);
  end if;

  return v_tenant;
end
$$;

-- Invitar a alguien al tenant del administrador que llama.
create or replace function public.invite_member(p_email text, p_role public.app_role default 'operador')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_email text := lower(trim(p_email));
  v_id uuid;
  v_user uuid;
begin
  if v_tenant is null or public.current_app_role() <> 'admin' then
    raise exception 'Solo un administrador puede invitar usuarios' using errcode = '42501';
  end if;

  if exists (select 1 from public.profiles where lower(email) = v_email and tenant_id is not null) then
    raise exception 'Ese usuario ya pertenece a un tenant' using errcode = '23505';
  end if;

  insert into public.invitations (tenant_id, email, role, invited_by)
  values (v_tenant, v_email, p_role, auth.uid())
  on conflict (tenant_id, email) where accepted_at is null do update set role = excluded.role
  returning id into v_id;

  select id into v_user from auth.users where lower(email) = v_email and email_confirmed_at is not null;
  if v_user is not null then
    perform public.claim_invitation(v_user, v_email);
  end if;

  return v_id;
end
$$;

-- Cambiar el rol de un miembro del mismo tenant (solo administradores).
create or replace function public.set_member_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := public.current_tenant_id();
begin
  if v_tenant is null or public.current_app_role() <> 'admin' then
    raise exception 'Solo un administrador puede cambiar roles' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id and tenant_id = v_tenant) then
    raise exception 'El usuario no pertenece a este tenant' using errcode = '42501';
  end if;

  -- Siempre tiene que quedar al menos un administrador activo.
  if p_role <> 'admin' and not exists (
    select 1 from public.profiles
    where tenant_id = v_tenant and role = 'admin' and active and id <> p_user_id
  ) then
    raise exception 'El tenant tiene que conservar al menos un administrador' using errcode = '23514';
  end if;

  update public.profiles set role = p_role, updated_at = now()
   where id = p_user_id and tenant_id = v_tenant;
end
$$;

-- Activar o desactivar a un miembro del mismo tenant (solo administradores).
create or replace function public.set_member_active(p_user_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := public.current_tenant_id();
begin
  if v_tenant is null or public.current_app_role() <> 'admin' then
    raise exception 'Solo un administrador puede activar o desactivar usuarios' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id and tenant_id = v_tenant) then
    raise exception 'El usuario no pertenece a este tenant' using errcode = '42501';
  end if;

  if not p_active and not exists (
    select 1 from public.profiles
    where tenant_id = v_tenant and role = 'admin' and active and id <> p_user_id
  ) then
    raise exception 'El tenant tiene que conservar al menos un administrador activo' using errcode = '23514';
  end if;

  update public.profiles set active = p_active, updated_at = now()
   where id = p_user_id and tenant_id = v_tenant;
end
$$;

-- Permisos de ejecución: por defecto Supabase deja ejecutar todo a anon/authenticated.
revoke execute on function public.claim_invitation(uuid, text) from public, anon, authenticated;
revoke execute on function public.handle_auth_user() from public, anon, authenticated;
revoke execute on function public.create_tenant(text, text, text) from public, anon, authenticated;

revoke execute on function public.invite_member(text, public.app_role) from public, anon;
revoke execute on function public.set_member_role(uuid, public.app_role) from public, anon;
revoke execute on function public.set_member_active(uuid, boolean) from public, anon;
grant execute on function public.invite_member(text, public.app_role) to authenticated;
grant execute on function public.set_member_role(uuid, public.app_role) to authenticated;
grant execute on function public.set_member_active(uuid, boolean) to authenticated;

revoke execute on function public.current_tenant_id() from public, anon;
revoke execute on function public.current_app_role() from public, anon;
grant execute on function public.current_tenant_id() to authenticated;
grant execute on function public.current_app_role() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security: todas las tablas, aislamiento por tenant y por rol.
-- Con RLS activo y sin policy para una operación, esa operación queda prohibida.
-- ---------------------------------------------------------------------------
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.legajos enable row level security;
alter table public.legajo_files enable row level security;
alter table public.contratos enable row level security;

-- tenants: cada usuario ve únicamente el suyo. Se crean desde SQL (create_tenant).
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants
  for select to authenticated
  using (id = (select public.current_tenant_id()));

-- profiles: se ve el propio perfil y los de su mismo tenant. El usuario solo puede
-- editar su nombre y avatar; tenant, rol y estado cambian únicamente con las
-- funciones de administración de arriba.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or tenant_id = (select public.current_tenant_id()));

drop policy if exists profiles_update_propio on public.profiles;
create policy profiles_update_propio on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- invitations: solo los administradores del tenant las ven y administran.
drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations
  for select to authenticated
  using (tenant_id = (select public.current_tenant_id()) and (select public.current_app_role()) = 'admin');

drop policy if exists invitations_delete on public.invitations;
create policy invitations_delete on public.invitations
  for delete to authenticated
  using (
    tenant_id = (select public.current_tenant_id())
    and (select public.current_app_role()) = 'admin'
    and accepted_at is null
  );

revoke insert, update, delete on public.invitations from anon, authenticated;
grant delete on public.invitations to authenticated;

-- legajos / legajo_files / contratos:
--   leer: cualquier miembro del tenant
--   crear: admin y operador, en su tenant y a su nombre
--   borrar: solo admin
drop policy if exists legajos_select on public.legajos;
create policy legajos_select on public.legajos
  for select to authenticated
  using (tenant_id = (select public.current_tenant_id()));

drop policy if exists legajos_insert on public.legajos;
create policy legajos_insert on public.legajos
  for insert to authenticated
  with check (
    tenant_id = (select public.current_tenant_id())
    and created_by = (select auth.uid())
    and (select public.current_app_role()) in ('admin', 'operador')
  );

drop policy if exists legajos_delete on public.legajos;
create policy legajos_delete on public.legajos
  for delete to authenticated
  using (tenant_id = (select public.current_tenant_id()) and (select public.current_app_role()) = 'admin');

drop policy if exists legajo_files_select on public.legajo_files;
create policy legajo_files_select on public.legajo_files
  for select to authenticated
  using (tenant_id = (select public.current_tenant_id()));

drop policy if exists legajo_files_insert on public.legajo_files;
create policy legajo_files_insert on public.legajo_files
  for insert to authenticated
  with check (
    tenant_id = (select public.current_tenant_id())
    and (select public.current_app_role()) in ('admin', 'operador')
    and exists (
      select 1 from public.legajos l
      where l.id = legajo_id and l.tenant_id = (select public.current_tenant_id())
    )
  );

drop policy if exists legajo_files_delete on public.legajo_files;
create policy legajo_files_delete on public.legajo_files
  for delete to authenticated
  using (tenant_id = (select public.current_tenant_id()) and (select public.current_app_role()) = 'admin');

drop policy if exists contratos_select on public.contratos;
create policy contratos_select on public.contratos
  for select to authenticated
  using (tenant_id = (select public.current_tenant_id()));

drop policy if exists contratos_insert on public.contratos;
create policy contratos_insert on public.contratos
  for insert to authenticated
  with check (
    tenant_id = (select public.current_tenant_id())
    and created_by = (select auth.uid())
    and (select public.current_app_role()) in ('admin', 'operador')
  );

drop policy if exists contratos_delete on public.contratos;
create policy contratos_delete on public.contratos
  for delete to authenticated
  using (tenant_id = (select public.current_tenant_id()) and (select public.current_app_role()) = 'admin');

-- Sin acceso anónimo a nada de lo anterior.
revoke all on public.tenants, public.profiles, public.invitations,
  public.legajos, public.legajo_files, public.contratos from anon;
-- Los datos de negocio no se editan: solo se crean, se leen y (admin) se borran.
revoke update on public.legajos, public.legajo_files, public.contratos from anon, authenticated;
revoke insert, update, delete on public.tenants from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado "legajo-files". Los archivos van en la carpeta de su
-- tenant:  <tenant_id>/<legajo_id>/<archivo>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'legajo-files',
  'legajo-files',
  false,
  20971520, -- 20 MB por archivo
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists legajo_files_storage_select on storage.objects;
create policy legajo_files_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'legajo-files'
    and (storage.foldername(name))[1] = (select public.current_tenant_id())::text
  );

drop policy if exists legajo_files_storage_insert on storage.objects;
create policy legajo_files_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'legajo-files'
    and (storage.foldername(name))[1] = (select public.current_tenant_id())::text
    and (select public.current_app_role()) in ('admin', 'operador')
  );

drop policy if exists legajo_files_storage_delete on storage.objects;
create policy legajo_files_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'legajo-files'
    and (storage.foldername(name))[1] = (select public.current_tenant_id())::text
    and (select public.current_app_role()) = 'admin'
  );
