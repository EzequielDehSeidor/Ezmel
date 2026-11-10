import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { can, type Permission } from "./roles";
import { getServerSession, hasAccess, type ActiveSession } from "./session";

/**
 * Guarda para Route Handlers: exige sesión, pertenencia a un tenant y el permiso pedido.
 * La autorización se verifica en cada request (no alcanza con el proxy ni con el layout).
 *
 *   const auth = await authorize("documentos:crear");
 *   if (!auth.ok) return auth.response;
 *   auth.session.tenant.id ...
 */
export async function authorize(
  permission: Permission
): Promise<{ ok: true; session: ActiveSession } | { ok: false; response: NextResponse }> {
  const session = await getServerSession();

  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Tu sesión venció. Volvé a iniciar sesión." }, { status: 401 }) };
  }
  if (!hasAccess(session)) {
    return { ok: false, response: NextResponse.json({ error: "Tu cuenta todavía no tiene acceso." }, { status: 403 }) };
  }
  if (!can(session.role, permission)) {
    return { ok: false, response: NextResponse.json({ error: "Tu rol no permite esta acción." }, { status: 403 }) };
  }
  return { ok: true, session };
}

/**
 * Guarda para páginas (Server Components): redirige si no hay sesión, si la cuenta no tiene
 * acceso o si el rol no alcanza para el permiso pedido.
 */
export async function requirePageAccess(permission: Permission = "documentos:leer"): Promise<ActiveSession> {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!hasAccess(session)) redirect("/sin-acceso");
  if (!can(session.role, permission)) redirect("/");
  return session;
}
