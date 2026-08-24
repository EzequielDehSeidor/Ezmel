import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Login con email/password en modo Supabase real. */
export async function POST(request: Request) {
  if (isMockMode()) {
    return NextResponse.json({ error: "Configurá Supabase o usá el login mock" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
