import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/supabase/env";
import { isRole } from "@/lib/auth/roles";
import { encodeMockSession, MOCK_COOKIE_NAME } from "@/lib/mock/auth";

/**
 * Login mock (email/password sin verificar, o botón "Google demo"). Sólo activo en modo mock,
 * que en producción está apagado (ver lib/supabase/env.ts). Acepta un `role` opcional para
 * probar los permisos sin Supabase.
 */
export async function POST(request: Request) {
  if (!isMockMode()) {
    return NextResponse.json({ error: "Modo mock deshabilitado" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const provider = body?.provider === "google-demo" ? "google-demo" : "password";
  const role = isRole(body?.role) ? body.role : undefined;

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const store = await cookies();
  store.set(MOCK_COOKIE_NAME, encodeMockSession({ email, provider, role }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
