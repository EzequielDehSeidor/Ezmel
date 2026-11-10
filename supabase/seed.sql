-- =============================================================================
-- Ezmel — alta del primer tenant y de su administrador
--
-- Correr en el SQL Editor DESPUÉS de schema.sql. Cambiá los tres valores.
--
--   p_name         nombre de la empresa (se muestra en la app)
--   p_slug         identificador corto en minúsculas, sin espacios (ej.: ezmel)
--   p_admin_email  email de quien va a administrar ese tenant. Tiene que ser el
--                  email con el que esa persona entra (el de su cuenta de Google o
--                  el que use para registrarse con email y contraseña).
--
-- Esa persona queda como administrador apenas inicie sesión con ese email
-- (confirmado). Si ya tenía cuenta, queda asociada en el momento.
-- =============================================================================

select public.create_tenant(
  p_name        => 'EzMel',
  p_slug        => 'ezmel',
  p_admin_email => 'admin@ezmel.net'
);

-- Para crear otro tenant (otra empresa) se repite la llamada con otros valores:
-- select public.create_tenant('Otra Empresa', 'otra-empresa', 'responsable@otra-empresa.com');

-- Consultas útiles --------------------------------------------------------------
-- Tenants:
--   select id, name, slug, active from public.tenants;
-- Miembros y roles:
--   select p.email, p.role, p.active, t.name as tenant
--   from public.profiles p left join public.tenants t on t.id = p.tenant_id order by t.name, p.email;
-- Invitaciones pendientes:
--   select t.name as tenant, i.email, i.role, i.created_at
--   from public.invitations i join public.tenants t on t.id = i.tenant_id where i.accepted_at is null;
-- Invitar a alguien desde el SQL Editor (como administrador no hace falta SQL: lo hace la app):
--   insert into public.invitations (tenant_id, email, role)
--   values ((select id from public.tenants where slug = 'ezmel'), 'operador@ezmel.net', 'operador');
-- Cambiar el rol de alguien (SQL Editor, como postgres):
--   update public.profiles set role = 'lectura' where email = 'alguien@ezmel.net';
-- Desactivar un tenant (corta el acceso a todos sus usuarios):
--   update public.tenants set active = false where slug = 'ezmel';
