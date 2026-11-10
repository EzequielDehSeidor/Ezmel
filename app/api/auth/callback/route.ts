import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, safeNextPath } from "@/lib/supabase/site-url";

/**
 * Callback de Supabase Auth: intercambia el `code` por una sesión. Lo usan el login con Google
 * (OAuth) y el link de confirmación de email al registrarse con email y contraseña.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const site = getSiteUrl(request);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  // El proveedor (Google) puede volver con un error, por ejemplo si el usuario canceló.
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${site}/login?error=oauth`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // La pantalla "/" decide si el usuario tiene acceso (tenant y rol) o va a /sin-acceso.
      return NextResponse.redirect(`${site}${next}`);
    }
  }

  return NextResponse.redirect(`${site}/login?error=auth`);
}
