import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Login con email/password en modo Supabase real. */
export async function POST(request: Request) {
  if (isMockMode()) {
    return NextResponse.json({ error: "Configurá Supabase o usá el login mock" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return NextResponse.json({ error: "Confirmá tu email antes de ingresar (revisá tu casilla)." }, { status: 401 });
    }
    // Mismo mensaje para "no existe" y "contraseña incorrecta": no revela qué emails tienen cuenta.
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
