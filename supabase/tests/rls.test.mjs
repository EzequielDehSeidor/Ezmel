// Pruebas de seguridad de supabase/schema.sql (aislamiento entre tenants, roles, invitaciones, Storage).
// Corren sobre PGlite (un Postgres en WebAssembly) con una emulación mínima de auth y storage de Supabase:
//   npm run test:db
// Correrlas cada vez que se cambie el esquema. No reemplazan probar contra el proyecto real de Supabase.
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const SCHEMA = fs.readFileSync(fileURLToPath(new URL("../schema.sql", import.meta.url)), "utf8");
const db = new PGlite();

// ---- Emulación mínima de lo que Supabase ya trae instalado ----
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    email_confirmed_at timestamptz,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (
    id text primary key, name text, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(), bucket_id text, name text
  );
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant select on auth.users to authenticated;  -- (solo para el test)
  grant all on storage.objects, storage.buckets to authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`);

let pass = 0, fail = 0;
const ok = (cond, name, extra = "") => {
  if (cond) { pass++; console.log("  ✔", name); }
  else { fail++; console.log("  ✘ FALLA:", name, extra); }
};

async function run(sql, params) {
  try { const r = await db.query(sql, params); return { rows: r.rows, count: r.affectedRows ?? r.rows.length }; }
  catch (e) { return { error: e.message }; }
}
// Ejecuta como un usuario de la app (rol authenticated + auth.uid())
async function as(uid, sql, params) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false); set role ${uid ? "authenticated" : "anon"};`);
  const r = await run(sql, params);
  await db.exec("reset role;");
  return r;
}
async function asPostgres(sql, params) { await db.exec("reset role;"); return run(sql, params); }

// ---- 1) El esquema corre, y es idempotente ----
console.log("\n1) Esquema");
await db.exec(SCHEMA).catch((e) => { console.log("ERROR esquema:", e.message); process.exit(1); });
ok(true, "schema.sql corre sin errores");
await db.exec(SCHEMA).catch((e) => { console.log("ERROR 2da corrida:", e.message); process.exit(1); });
ok(true, "schema.sql se puede volver a correr (idempotente)");

// ---- 2) Tenants y usuarios ----
console.log("\n2) Tenants e invitaciones");
const tA = (await asPostgres(`select public.create_tenant('Empresa A','empresa-a','adminA@a.com') as id`)).rows[0].id;
const tB = (await asPostgres(`select public.create_tenant('Empresa B','empresa-b','adminB@b.com') as id`)).rows[0].id;
ok(tA && tB && tA !== tB, "create_tenant crea dos tenants");

const newUser = async (email, confirmed = true, meta = {}) =>
  (await asPostgres(
    `insert into auth.users (email, email_confirmed_at, raw_user_meta_data) values ($1, ${confirmed ? "now()" : "null"}, $2::jsonb) returning id`,
    [email, JSON.stringify(meta)]
  )).rows[0].id;
const prof = async (id) => (await asPostgres(`select tenant_id, role, active, full_name from public.profiles where id = $1`, [id])).rows[0];

const adminA = await newUser("AdminA@a.com", true, { full_name: "Admin A" });
const adminB = await newUser("adminB@b.com");
let p = await prof(adminA);
ok(p.tenant_id === tA && p.role === "admin", "el admin invitado queda admin de su tenant (email sin importar mayúsculas)");
ok(p.full_name === "Admin A", "toma el nombre del metadata de Google");
p = await prof(adminB);
ok(p.tenant_id === tB && p.role === "admin", "el admin de B queda en B");

const extraño = await newUser("nadie@x.com");
p = await prof(extraño);
ok(p.tenant_id === null && p.role === null, "un usuario sin invitación queda SIN tenant ni rol");

// Email/contraseña: no confirmado => no hereda la invitación
const opSinConfirmar = await newUser("op@a.com", false);
await as(adminA, `select public.invite_member('Op@A.com','operador')`);
p = await prof(opSinConfirmar);
ok(p.tenant_id === null, "invitación NO se aplica a un email sin confirmar");
await asPostgres(`update auth.users set email_confirmed_at = now() where id = $1`, [opSinConfirmar]);
p = await prof(opSinConfirmar);
ok(p.tenant_id === tA && p.role === "operador", "al confirmar el email se aplica la invitación");

const lectura = await newUser("lee@a.com");
await as(adminA, `select public.invite_member('lee@a.com','lectura')`);
p = await prof(lectura);
ok(p.tenant_id === tA && p.role === "lectura", "invite_member sobre usuario ya registrado lo asocia en el acto");

let r = await as(opSinConfirmar, `select public.invite_member('x@a.com','admin')`);
ok(!!r.error, "un operador NO puede invitar", r.error);
r = await as(extraño, `select public.invite_member('x@a.com','admin')`);
ok(!!r.error, "un usuario sin tenant NO puede invitar");
r = await as(adminA, `select public.invite_member('adminB@b.com','operador')`);
ok(!!r.error, "no se puede invitar a alguien que ya pertenece a otro tenant", r.error);
r = await as(adminA, `select public.create_tenant('Hack','hack','a@a.com')`);
ok(!!r.error, "un usuario autenticado NO puede ejecutar create_tenant", r.error);
r = await as(null, `select public.create_tenant('Hack','hack','a@a.com')`);
ok(!!r.error, "anon NO puede ejecutar create_tenant");

// ---- 3) Aislamiento y permisos sobre datos ----
console.log("\n3) Datos: aislamiento entre tenants y permisos por rol");
const id = () => crypto.randomUUID();
const leg = (tenant, by) => [id(), tenant, by, JSON.stringify({ nombre: "x" })];
const insLeg = (uid, tenant, by) =>
  as(uid, `insert into public.legajos (id, tenant_id, created_by, data) values ($1,$2,$3,$4::jsonb) returning id`, leg(tenant, by));

r = await insLeg(opSinConfirmar, tA, opSinConfirmar);
ok(!r.error, "operador crea legajo en su tenant", r.error);
const legA = r.rows?.[0]?.id;
r = await insLeg(opSinConfirmar, tB, opSinConfirmar);
ok(!!r.error, "operador NO puede crear legajo en otro tenant");
r = await insLeg(opSinConfirmar, tA, adminA);
ok(!!r.error, "operador NO puede crear legajo a nombre de otro usuario");
r = await insLeg(lectura, tA, lectura);
ok(!!r.error, "rol lectura NO puede crear");
r = await insLeg(extraño, tA, extraño);
ok(!!r.error, "usuario sin tenant NO puede crear");
r = await insLeg(null, tA, adminA);
ok(!!r.error, "anon NO puede crear");

r = await as(lectura, `select id from public.legajos`);
ok(r.rows?.length === 1, "lectura SÍ ve los legajos de su tenant");
r = await as(adminB, `select id from public.legajos`);
ok(r.rows?.length === 0, "admin de OTRO tenant no ve nada");
r = await as(extraño, `select id from public.legajos`);
ok(r.rows?.length === 0, "usuario sin tenant no ve nada");
r = await as(null, `select id from public.legajos`);
ok(!!r.error, "anon no puede ni consultar la tabla");

r = await as(opSinConfirmar, `delete from public.legajos where id = $1`, [legA]);
ok((r.count ?? 0) === 0, "operador NO puede borrar");
r = await as(adminB, `delete from public.legajos where id = $1`, [legA]);
ok((r.count ?? 0) === 0, "admin de otro tenant NO puede borrar");
r = await as(opSinConfirmar, `update public.legajos set data = '{}'::jsonb where id = $1`, [legA]);
ok(!!r.error, "los legajos no se pueden editar");

// contratos
const insCon = (uid, tenant, by) =>
  as(uid, `insert into public.contratos (id, tenant_id, created_by, datos) values ($1,$2,$3,'{}'::jsonb) returning id`, [id(), tenant, by]);
r = await insCon(adminA, tA, adminA);
ok(!r.error, "admin crea contrato");
r = await insCon(lectura, tA, lectura);
ok(!!r.error, "lectura NO crea contrato");
r = await as(adminB, `select id from public.contratos`);
ok(r.rows?.length === 0, "otro tenant no ve contratos ajenos");

// archivos de legajo
r = await as(opSinConfirmar, `insert into public.legajo_files (tenant_id, legajo_id, slot_key, file_name, storage_path) values ($1,$2,'dni','a.png','x')`, [tA, legA]);
ok(!r.error, "operador sube registro de archivo a su legajo", r.error);
r = await as(adminB, `insert into public.legajo_files (tenant_id, legajo_id, slot_key, file_name, storage_path) values ($1,$2,'dni','a.png','x')`, [tB, legA]);
ok(!!r.error, "NO se puede colgar archivos de un legajo de otro tenant");

r = await as(adminA, `delete from public.legajos where id = $1`, [legA]);
ok(r.count === 1, "admin SÍ borra legajos de su tenant");

// ---- 4) Escalada de privilegios ----
console.log("\n4) Escalada de privilegios");
r = await as(opSinConfirmar, `update public.profiles set role = 'admin' where id = $1`, [opSinConfirmar]);
ok(!!r.error, "un operador NO puede subirse el rol");
r = await as(opSinConfirmar, `update public.profiles set tenant_id = $1 where id = $2`, [tB, opSinConfirmar]);
ok(!!r.error, "un operador NO puede cambiarse de tenant");
r = await as(opSinConfirmar, `update public.profiles set active = true where id = $1`, [opSinConfirmar]);
ok(!!r.error, "no puede tocar su estado activo");
r = await as(opSinConfirmar, `update public.profiles set full_name = 'Nuevo Nombre' where id = $1`, [opSinConfirmar]);
ok(!r.error && r.count === 1, "SÍ puede editar su propio nombre");
r = await as(opSinConfirmar, `update public.profiles set full_name = 'Hackeado' where id = $1`, [adminA]);
ok((r.count ?? 0) === 0, "NO puede editar el perfil de otro");
r = await as(opSinConfirmar, `insert into public.profiles (id, email, tenant_id, role) values (gen_random_uuid(),'x@x.com',$1,'admin')`, [tA]);
ok(!!r.error, "NO puede insertar perfiles");
r = await as(adminA, `insert into public.tenants (name, slug) values ('x','x')`);
ok(!!r.error, "ni siquiera un admin puede insertar tenants directo");
r = await as(adminA, `insert into public.invitations (tenant_id, email, role) values ($1,'z@z.com','admin')`, [tA]);
ok(!!r.error, "las invitaciones solo se crean con invite_member");
r = await as(opSinConfirmar, `select * from public.invitations`);
ok(r.rows?.length === 0, "un operador no ve invitaciones");
r = await as(adminA, `select * from public.invitations`);
ok(r.rows?.length >= 0 && !r.error, "un admin sí consulta las invitaciones de su tenant");
r = await as(adminB, `select * from public.invitations where tenant_id = $1`, [tA]);
ok(r.rows?.length === 0, "admin de otro tenant no ve invitaciones ajenas");
r = await as(adminB, `select * from public.profiles where tenant_id = $1`, [tA]);
ok(r.rows?.length === 0, "no se ven perfiles de otro tenant");
r = await as(adminA, `select * from public.profiles`);
ok(r.rows?.length === 3, "un miembro ve los perfiles de su tenant (3)", String(r.rows?.length));
r = await as(adminB, `select * from public.tenants`);
ok(r.rows?.length === 1 && r.rows[0].id === tB, "solo se ve el propio tenant");

// ---- 5) Gestión de miembros ----
console.log("\n5) Gestión de miembros");
r = await as(opSinConfirmar, `select public.set_member_role($1,'admin')`, [opSinConfirmar]);
ok(!!r.error, "un operador no cambia roles");
r = await as(adminB, `select public.set_member_role($1,'lectura')`, [opSinConfirmar]);
ok(!!r.error, "un admin de otro tenant no cambia roles ajenos");
r = await as(adminA, `select public.set_member_role($1,'lectura')`, [adminA]);
ok(!!r.error, "no se puede dejar al tenant sin administradores");
r = await as(adminA, `select public.set_member_role($1,'admin')`, [opSinConfirmar]);
ok(!r.error, "un admin promueve a un operador", r.error);
r = await as(adminA, `select public.set_member_role($1,'operador')`, [adminA]);
ok(!r.error, "con otro admin presente, un admin puede bajarse el rol", r.error);
r = await as(opSinConfirmar, `select public.set_member_active($1,false)`, [adminA]);
ok(!r.error, "(el ex-operador ahora admin) desactiva a otro", r.error);
r = await as(adminA, `select * from public.legajos`);
ok(r.rows?.length === 0 && !r.error, "un usuario desactivado ya no ve datos");
r = await as(adminA, `insert into public.legajos (id, tenant_id, created_by, data) values (gen_random_uuid(),$1,$2,'{}'::jsonb)`, [tA, adminA]);
ok(!!r.error, "un usuario desactivado no puede crear");
r = await as(opSinConfirmar, `select public.set_member_active($1,false)`, [opSinConfirmar]);
ok(!!r.error, "no se puede desactivar al último admin activo");

// ---- 6) Tenant inactivo ----
console.log("\n6) Tenant inactivo");
await asPostgres(`update public.tenants set active = false where id = $1`, [tB]);
r = await as(adminB, `select * from public.legajos`);
ok(r.rows?.length === 0, "con el tenant desactivado el admin pierde el acceso");
r = await as(adminB, `select * from public.tenants`);
ok(r.rows?.length === 0, "y ya no ve ni su tenant");

// ---- 7) Storage ----
console.log("\n7) Storage (bucket privado por tenant)");
const bucket = (await asPostgres(`select public, file_size_limit, allowed_mime_types from storage.buckets where id='legajo-files'`)).rows[0];
ok(bucket && bucket.public === false, "el bucket legajo-files existe y es privado");
const insObj = (uid, name) => as(uid, `insert into storage.objects (bucket_id, name) values ('legajo-files', $1)`, [name]);
r = await insObj(opSinConfirmar, `${tA}/${id()}/dni-1.png`);
ok(!r.error, "sube a la carpeta de su tenant", r.error);
r = await insObj(opSinConfirmar, `${tB}/${id()}/dni-1.png`);
ok(!!r.error, "NO puede subir a la carpeta de otro tenant");
r = await insObj(lectura, `${tA}/${id()}/dni-1.png`);
ok(!!r.error, "lectura NO puede subir");
r = await insObj(null, `${tA}/${id()}/dni-1.png`);
ok(!!r.error, "anon NO puede subir");
r = await as(lectura, `select name from storage.objects where bucket_id='legajo-files'`);
ok(r.rows?.length === 1, "lectura SÍ ve archivos de su tenant");
r = await as(extraño, `select name from storage.objects where bucket_id='legajo-files'`);
ok(r.rows?.length === 0, "usuario sin tenant no ve archivos");
r = await as(adminB, `select name from storage.objects where bucket_id='legajo-files'`);
ok(r.rows?.length === 0, "otro tenant no ve archivos ajenos");

console.log(`\nResultado: ${pass} OK, ${fail} fallas`);
process.exit(fail ? 1 : 0);
