# Ezmel — Supabase (tenants, roles, login) y deploy en Netlify

Guía paso a paso para pasar la app de modo demo a producción. Tiempo estimado: 45–60 minutos
la primera vez.

## 1. Cómo funciona la seguridad

**Tenants.** Cada empresa que usa la app es un *tenant*. Todos los datos (legajos, contratos,
archivos) llevan el `tenant_id` de quien los creó y la base de datos (Row Level Security) impide
ver o tocar datos de otro tenant, aunque alguien intente saltearse la app.

**Roles.** Cada usuario pertenece a un único tenant con un rol:

| Rol | Ver legajos y contratos | Crear y descargar documentos | Gestionar usuarios |
|---|---|---|---|
| `admin` (Administrador) | sí | sí | sí |
| `operador` (Operador) | sí | sí | no |
| `lectura` (Solo lectura) | sí | no | no |

**Acceso por invitación.** Crear una cuenta (con Google o con email y contraseña) **no da acceso**.
Para entrar hay que haber sido invitado a un tenant con *ese mismo email*, y el email tiene que estar
confirmado. Quien no está invitado ve la pantalla "Tu cuenta todavía no tiene acceso".

**Login.** Dos formas, las dos con Supabase Auth: **Google** y **email + contraseña** (con confirmación
por email).

**Capas de defensa** (si una falla, la siguiente sigue protegiendo):

1. `proxy.ts`: sin sesión no se entra a ninguna página ni API (las APIs responden 401).
2. Cada página y cada API verifican sesión, tenant y rol (`lib/auth/guards.ts`).
3. La base de datos aplica RLS por tenant y por rol (`supabase/schema.sql`), y Storage guarda los
   archivos en una carpeta por tenant.

> La app **no usa** la `service_role key` de Supabase y no hay que cargarla en ningún lado.

---

## 2. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) → **New project**.
2. Elegí organización, nombre (ej. `ezmel`), una contraseña de base de datos fuerte (guardala) y la
   región más cercana (para Argentina: **South America (São Paulo)**).
3. Esperá a que termine de aprovisionarse (2–3 minutos).

## 3. Crear la base de datos

1. En el proyecto: **SQL Editor** → **New query**.
2. Pegá **todo** el contenido de [`supabase/schema.sql`](../supabase/schema.sql) y apretá **Run**.
   Tiene que terminar con *Success. No rows returned*. Se puede volver a correr sin problemas.
3. Verificá en **Table Editor** que existan `tenants`, `profiles`, `invitations`, `legajos`,
   `legajo_files` y `contratos`, todas con el candado de RLS activado, y en **Storage** el bucket
   privado `legajo-files`.

## 4. Crear el primer tenant y su administrador

1. Abrí [`supabase/seed.sql`](../supabase/seed.sql) y cambiá los tres valores:
   - `p_name`: nombre de la empresa.
   - `p_slug`: identificador corto en minúsculas (ej. `ezmel`).
   - `p_admin_email`: el email con el que va a entrar quien administre (el de su Google, o el que use
     para registrarse con contraseña).
2. Pegalo en el SQL Editor y **Run**.
3. Comprobá: `select * from public.tenants;` y `select * from public.invitations;` (tiene que haber una
   invitación pendiente con rol `admin`).

Esa persona queda como administrador **la primera vez que inicie sesión** con ese email.
Para crear otra empresa, se repite la llamada a `create_tenant(...)` con otros datos.

## 5. Configurar la autenticación

En **Authentication** del proyecto:

### 5.1 Email y contraseña
- **Sign In / Providers → Email**: dejarlo habilitado y **activar "Confirm email"**. Es obligatorio:
  evita que alguien se registre con el email de otra persona y se quede con su invitación.
- Largo mínimo de contraseña: 8 o más. Si tu plan lo ofrece, activá también la protección contra
  contraseñas filtradas.

### 5.2 URLs (muy importante para que funcione el deploy)
En **URL Configuration**:

- **Site URL**: la URL de producción (ej. `https://tu-sitio.netlify.app`). Hasta tener el sitio en
  Netlify podés poner `http://localhost:3000` y cambiarla en el paso 8.
- **Redirect URLs** (agregar todas):
  - `http://localhost:3000/api/auth/callback`
  - `https://tu-sitio.netlify.app/api/auth/callback`
  - (si usás dominio propio) `https://tu-dominio.com/api/auth/callback`

### 5.3 Login con Google
1. [Google Cloud Console](https://console.cloud.google.com/) → crear o elegir un proyecto.
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo *Externo*, completar nombre de la
   app y email de soporte, y publicar la app (o agregar los usuarios como "de prueba" mientras tanto).
3. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web**.
   - **URI de redireccionamiento autorizado**: la que muestra Supabase en
     *Authentication → Sign In / Providers → Google* (tiene la forma
     `https://<id-del-proyecto>.supabase.co/auth/v1/callback`). **No** va la URL de Netlify acá.
4. Copiar el *Client ID* y el *Client Secret* y pegarlos en Supabase, en
   *Authentication → Sign In / Providers → Google*, y activarlo.

### 5.4 Emails de confirmación (antes de salir a producción)
El envío de emails que trae Supabase por defecto está pensado para pruebas y tiene un límite muy bajo
(unos pocos emails por hora). Para producción configurá tu propio SMTP en
**Authentication → Emails → SMTP Settings** (Resend, SendGrid, Amazon SES, tu casilla corporativa…).

## 6. Conectar el proyecto (local)

1. En Supabase: **Project Settings → API**. Copiá:
   - **Project URL** (`https://xxxx.supabase.co`)
   - la clave **pública**: `anon` o `publishable`. **Nunca** la `service_role` / `secret`.
2. En la carpeta del proyecto:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...        # (o sb_publishable_...)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. `npm install` y `npm run dev`. Apenas están las dos primeras variables la app sale del modo demo y
   usa Supabase de verdad.
4. Probá: iniciá sesión con el email del administrador (Google, o "Creá tu cuenta" → confirmar el
   email → iniciar sesión). Abajo a la izquierda tiene que figurar **Administrador · nombre del tenant**.

## 7. Dar de alta usuarios

Por ahora se hace desde el SQL Editor (la pantalla "Usuarios y permisos" queda para la próxima etapa).
Ejemplos en [`supabase/seed.sql`](../supabase/seed.sql):

```sql
-- Invitar a un operador (entra la primera vez que inicie sesión con ese email)
insert into public.invitations (tenant_id, email, role)
values ((select id from public.tenants where slug = 'ezmel'), 'operador@ezmel.net', 'operador');

-- Cambiar el rol de alguien
update public.profiles set role = 'lectura' where email = 'alguien@ezmel.net';

-- Dar de baja a un usuario (no podrá entrar más)
update public.profiles set active = false where email = 'alguien@ezmel.net';
```

Roles posibles: `admin`, `operador`, `lectura`. Los emails se guardan en minúsculas.

La base ya incluye las funciones `invite_member`, `set_member_role` y `set_member_active` (solo las
puede usar un administrador, desde la app) que usará la pantalla de usuarios.

## 8. Deploy en Netlify

1. Subí el proyecto a GitHub (ya está).
2. En [Netlify](https://app.netlify.com): **Add new site → Import an existing project** → elegí el
   repositorio. Netlify detecta Next.js solo (el archivo [`netlify.toml`](../netlify.toml) fija Node 22).
3. **Antes de desplegar**: *Site configuration → Environment variables → Add a variable*, con alcance
   "All scopes" (builds, functions y runtime):

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | la Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clave pública (`anon` / `publishable`) |
   | `NEXT_PUBLIC_SITE_URL` | la URL del sitio en Netlify (sin `/` al final) |

   Las variables `NEXT_PUBLIC_*` se incorporan **al compilar**: si las cambiás, hay que volver a
   desplegar (*Deploys → Trigger deploy → Clear cache and deploy site*).
4. **Deploy**. Cuando termine, copiá la URL real del sitio y volvé a Supabase (paso 5.2) para
   cargarla en **Site URL** y en **Redirect URLs** (`https://<tu-sitio>/api/auth/callback`). Si la URL
   cambió respecto de `NEXT_PUBLIC_SITE_URL`, corregí esa variable y redesplegá.
5. Probá en producción: login con Google, login con email, crear un contrato y un legajo, cerrar sesión.

Si el deploy queda sin las variables de Supabase, la app **no se abre sin login**: responde con un
error que dice qué variables faltan. Eso es a propósito.

## 9. Limitaciones a tener en cuenta en Netlify

- **Tamaño de los envíos**: las funciones de Netlify aceptan pedidos de hasta ~6 MB. El legajo se envía
  con sus adjuntos (imágenes ya reducidas por el navegador). Con muchos adjuntos grandes la descarga
  puede fallar. Probalo en el deploy con un legajo realista; si molesta, el cambio a hacer es subir los
  archivos directo a Storage desde el navegador.
- **Tiempo de ejecución**: generar PDF/Word/Excel con muchas imágenes puede tardar. Revisá el límite de
  tiempo de funciones de tu plan de Netlify.

## 10. Probar los permisos sin Supabase (modo demo)

En desarrollo, sin variables de Supabase, el login demo acepta un rol:

```bash
curl -X POST http://localhost:3000/api/auth/mock-login -H "Content-Type: application/json" \
  -c cookies.txt -d '{"email":"prueba@demo.com","role":"lectura"}'
```

(`admin` por defecto; también `operador` y `lectura`.) El modo demo **solo existe en desarrollo**.

## 11. Pruebas automáticas de la base

```bash
npm run test:db
```

Corre `supabase/schema.sql` sobre un Postgres local (PGlite) y verifica: aislamiento entre tenants,
permisos por rol, invitaciones (incluido que no valgan sin email confirmado), que nadie pueda
subirse el rol o cambiarse de tenant, y las reglas de Storage. Conviene correrlo cada vez que se
modifique el esquema. No reemplaza probar contra el proyecto real (paso 6 y 8).

## 12. Checklist antes de usar con datos reales

- [ ] "Confirm email" activado en Supabase.
- [ ] SMTP propio configurado.
- [ ] Site URL y Redirect URLs con la URL de producción.
- [ ] Variables `NEXT_PUBLIC_*` cargadas en Netlify y sitio redesplegado.
- [ ] `service_role` / `secret` key **no** cargada en Netlify ni en el repo.
- [ ] Al menos un administrador del tenant, y que sea una persona real con acceso a ese email.
- [ ] Probado con un usuario `operador` y uno `lectura`.
- [ ] Probado que un email sin invitación ve "Tu cuenta todavía no tiene acceso".

## 13. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| Todo el sitio muestra error 500 en producción | Faltan `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Netlify, o no se redesplegó después de cargarlas. |
| Google: `redirect_uri_mismatch` | En Google Cloud la URI autorizada tiene que ser exactamente la de Supabase (`https://<proyecto>.supabase.co/auth/v1/callback`). |
| Después de Google vuelve al login con "No se pudo completar el inicio de sesión" | Falta la URL `https://<tu-sitio>/api/auth/callback` en *Redirect URLs* de Supabase, o la *Site URL* es otra. |
| Entra pero ve "Tu cuenta todavía no tiene acceso" | Ese email no tiene invitación (revisá `select * from public.invitations;`), o se registró con otro email. Si ya existía el perfil, ver `select email, tenant_id, role, active from public.profiles;`. |
| No llega el email de confirmación | Límite del envío por defecto de Supabase: configurá SMTP propio (5.4). Revisá spam. |
| Al abrir el link de confirmación en otro navegador vuelve al login con un error | Es normal: el email igual queda confirmado. Iniciá sesión normalmente. |
| "Email o contraseña incorrectos" con la cuenta recién creada | Falta confirmar el email (el mensaje lo aclara si es ese el caso). |
| Un operador no puede descargar | Revisá su rol en `profiles` (`lectura` no puede crear documentos). |
