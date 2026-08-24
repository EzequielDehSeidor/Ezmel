<<<<<<< HEAD
# Ezmel
=======
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

## Pasar a Supabase real

1. **Crear el proyecto**: entrá a [supabase.com](https://supabase.com) → "New project".
   Guardá la contraseña de la base y esperá a que termine de aprovisionarse.

2. **Cargar el esquema**: en el proyecto, andá a *SQL Editor* → *New query*, pegá el
   contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecutalo. Crea las tablas
   `legajos` y `legajo_files` con Row Level Security habilitado.

3. **Crear el bucket de archivos**: *Storage* → *New bucket* → nombre `legajo-files`,
   dejalo **privado** (no marcar "Public bucket"). Después aplicá las dos policies que
   están comentadas al final de `supabase/schema.sql` (Storage → Policies → New policy →
   pegar el SQL).

4. **Habilitar login con Google** (opcional, para el botón "Continuar con Google" real):
   - En [Google Cloud Console](https://console.cloud.google.com/) creá credenciales OAuth
     2.0 (tipo "Web application"). Como *Authorized redirect URI* usá la que te muestra
     Supabase en el paso siguiente.
   - En Supabase: *Authentication* → *Providers* → *Google* → activalo y pegá el Client ID
     y Client Secret.
   - Habilitá también *Email* en *Authentication* → *Providers* si querés que el
     email/password use el mismo mecanismo (ya viene activado por defecto).

5. **Crear el usuario admin**: *Authentication* → *Users* → *Add user* (con email y
   contraseña), o simplemente registralo por Google la primera vez que entre.

6. **Variables de entorno**: copiá `.env.local.example` a `.env.local` y completá con los
   valores de *Settings* → *API* del proyecto:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

7. Reiniciá `npm run dev`. Apenas esas dos variables están presentes, la app deja el modo
   mock automáticamente: el login usa Supabase Auth de verdad y los legajos (con sus
   archivos) se guardan en la base y en Storage.

## Estructura

- `components/legajo/LegajoWizard.tsx` — wizard de 3 pasos (datos → documentación → revisión y descarga)
- `components/legajo/LegajoDocumentPreview.tsx` — vista previa con formato tipo Word
- `lib/types/legajo.ts` — modelo del legajo y `FILE_CATEGORIES` (las categorías de adjuntos)
- `lib/pdf/pdfToPngPages.ts` — rasteriza los PDF adjuntos en el navegador (ver nota abajo)
- `lib/export/` — generación de `.docx` (`docx`), `.pdf` (`@react-pdf/renderer`) y `.xlsx` (`exceljs`)
- `lib/data/legajos.ts` — guarda el legajo (mock en memoria, o Supabase + Storage)
- `lib/auth/session.ts`, `lib/supabase/`, `lib/mock/` — capa de auth unificada mock/Supabase
- `supabase/schema.sql` — esquema de base de datos y policies de Storage

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

- Sólo hay rol **admin**; el rol "usuario" queda para una siguiente etapa.
- El cierre del legajo es "Responsable del legajo": quién lo armó y en qué
  fecha (campos de texto, no una firma manuscrita).
- En modo mock los archivos adjuntos no se persisten (sólo viajan para generar la
  descarga); en modo Supabase real sí se suben al bucket `legajo-files`.
>>>>>>> 70b69d1 (Initial commit)
