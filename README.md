# Ezmel — Legajos de Cliente

App interna para armar el "Legajo de Cliente" (antes un Word) de forma digital: login de
administrador, formulario multi-paso con carga de imágenes/archivos, y descarga del legajo
en Word / PDF / Excel.

## Correr en modo demo (sin Supabase)

No hace falta ninguna configuración: mientras no exista `.env.local`, la app arranca en
**modo mock** — el login acepta cualquier email/contraseña (y hay un botón "Google (demo)")
y los legajos se guardan en memoria del servidor (se pierden al reiniciar `npm run dev`).

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Pasar a Supabase real (tenants, roles y login)

La app es multi-tenant y con roles (`admin`, `operador`, `lectura`), con login por **Google** y por
**email y contraseña** (Supabase Auth). El acceso es por invitación: crear una cuenta no alcanza,
hay que estar invitado a un tenant con ese email.

Guía completa, paso a paso (crear el proyecto, cargar la base, crear el tenant, configurar Google,
variables de entorno y deploy en Netlify): **[docs/SUPABASE-Y-NETLIFY.md](docs/SUPABASE-Y-NETLIFY.md)**.

Resumen:

1. Crear el proyecto en Supabase y correr [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor.
2. Crear el primer tenant y su administrador con [`supabase/seed.sql`](supabase/seed.sql).
3. En Supabase: activar *Confirm email*, cargar las URLs y configurar el proveedor Google.
4. Copiar `.env.local.example` a `.env.local` y completar `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SITE_URL`.
5. Las mismas variables se cargan en Netlify antes del primer deploy.

En producción las variables de Supabase son **obligatorias**: si faltan, la app corta con un error
en vez de abrirse sin login (el modo demo solo existe en desarrollo).

Pruebas de la base de datos (aislamiento entre tenants, roles, invitaciones, Storage): `npm run test:db`.

## Estructura

- `components/legajo/LegajoWizard.tsx` — wizard de 3 pasos (datos → documentación → revisión y descarga)
- `components/legajo/LegajoDocumentPreview.tsx` — vista previa con formato tipo Word
- `lib/types/legajo.ts` — modelo del legajo y `FILE_CATEGORIES` (las categorías de adjuntos)
- `lib/pdf/pdfToPngPages.ts` — rasteriza los PDF adjuntos en el navegador (ver nota abajo)
- `lib/export/` — generación de `.docx` (`docx`), `.pdf` (`@react-pdf/renderer`) y `.xlsx` (`exceljs`)
- `lib/data/legajos.ts` — guarda el legajo (mock en memoria, o Supabase + Storage)
- `lib/auth/` — sesión (`session.ts`), roles y permisos (`roles.ts`) y guardas para páginas y APIs (`guards.ts`)
- `lib/supabase/`, `lib/mock/` — clientes de Supabase y modo demo (solo desarrollo)
- `proxy.ts` — primer filtro: exige sesión y refresca el token de Supabase
- `supabase/schema.sql` — tablas, funciones, RLS y Storage (multi-tenant y roles); `supabase/seed.sql` — alta del primer tenant
- `supabase/tests/rls.test.mjs` — pruebas de seguridad de la base (`npm run test:db`)
- `docs/SUPABASE-Y-NETLIFY.md` — guía de puesta en producción

### Adjuntos y PDF

Cada categoría de `FILE_CATEGORIES` acepta **varios** archivos (imágenes o PDF).
Antes de subirlos, el navegador deja todo como imagen: los PDF se rasterizan
página por página y las imágenes en formatos que Word/PDF no incrustan (webp,
avif, heic…) se reencodan a PNG. Así el servidor sólo maneja PNG/JPEG.

El rasterizado va en el cliente a propósito: pdfjs necesita APIs de canvas que
`node-canvas` no expone (con él las páginas salían en blanco), y de paso evita
un módulo nativo en el servidor. Dos detalles que hacen falta para que funcione:

- El worker se instancia a mano con `type: "module"`; con `workerSrc` el
  navegador lo carga como script clásico, falla, y pdfjs cae a un "fake worker"
  que se queda colgado en vez de dar error.
- El render usa `intent: "print"`; con `"display"` pdfjs avanza el render con
  `requestAnimationFrame`, que no dispara si la pestaña está en segundo plano.

Los assets de pdfjs (`worker`, `standard_fonts`, `cmaps`) viven en
`public/pdfjs/`. Si actualizás `pdfjs-dist`, volvé a copiarlos desde
`node_modules/pdfjs-dist/`.

## Notas de esta primera etapa

- Roles: **admin**, **operador** y **solo lectura** (ver docs/SUPABASE-Y-NETLIFY.md). La pantalla para invitar y gestionar usuarios queda para una siguiente etapa; por ahora se hace desde el SQL Editor.
- El cierre del legajo es "Responsable del legajo": quién lo armó y en qué
  fecha (campos de texto, no una firma manuscrita).
- En modo mock los archivos adjuntos no se persisten (sólo viajan para generar la
  descarga); en modo Supabase real sí se suben al bucket `legajo-files`.
