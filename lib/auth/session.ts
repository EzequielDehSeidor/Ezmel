import { cache } from "react";
import { cookies } from "next/headers";
import { isMockMode } from "@/lib/supabase/env";
import { decodeMockSession, MOCK_COOKIE_NAME } from "@/lib/mock/auth";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { isRole, type Role } from "./roles";

export interface AppSession {
  userId: string;
  email: string;
  name: string | null;
  mock: boolean;
  /** null = la cuenta existe pero todavía no pertenece a ningún tenant activo (falta invitación). */
  tenant: { id: string; name: string } | null;
  role: Role | null;
}

/** Sesión con acceso: pertenece a un tenant activo y tiene un rol. */
export type ActiveSession = AppSession & { tenant: { id: string; name: string }; role: Role };

export function hasAccess(session: AppSession | null): session is ActiveSession {
  return !!session && !!session.tenant && !!session.role;
}

/**
 * Sesión actual, unificada entre modo mock y Supabase real. Uso: Server Components y Route Handlers.
 * Se resuelve una sola vez por request (cache de React).
 */
export const getServerSession = cache(async (): Promise<AppSession | null> => {
  // Leer las cookies primero: marca la página como dinámica (nunca se prerenderiza con la sesión
  // de otro) antes de evaluar la configuración.
  const store = await cookies();

  if (isMockMode()) {
    const session = decodeMockSession(store.get(MOCK_COOKIE_NAME)?.value);
    if (!session) return null;
    return {
      userId: "mock-user",
      email: session.email,
      name: null,
      mock: true,
      tenant: { id: "mock-tenant", name: "Demo" },
      role: session.role ?? "admin",
    };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  // RLS: cada usuario sólo puede leer su propio perfil; el tenant sólo se ve si está activo.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role, active, tenant_id, tenants(id, name, active)")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[auth] No se pudo leer el perfil:", error.message);
  }

  const tenantRow = Array.isArray(profile?.tenants) ? profile?.tenants[0] : profile?.tenants;
  const active = !!profile?.active && !!tenantRow?.active && isRole(profile?.role);

  return {
    userId: user.id,
    email: user.email,
    name: profile?.full_name ?? null,
    mock: false,
    tenant: active && tenantRow ? { id: tenantRow.id, name: tenantRow.name } : null,
    role: active && isRole(profile?.role) ? profile.role : null,
  };
});
