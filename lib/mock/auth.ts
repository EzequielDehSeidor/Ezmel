import { isRole, type Role } from "@/lib/auth/roles";

export const MOCK_COOKIE_NAME = "ezmel_mock_session";

export interface MockSession {
  email: string;
  provider: "password" | "google-demo";
  /** Rol de la sesión demo (por defecto admin). Sirve para probar los permisos sin Supabase. */
  role?: Role;
}

/** Codifica la sesión mock para guardarla en una cookie de texto plano (sólo demo, no producción). */
export function encodeMockSession(session: MockSession): string {
  return Buffer.from(JSON.stringify(session), "utf-8").toString("base64");
}

export function decodeMockSession(raw: string | undefined | null): MockSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    if (parsed && typeof parsed.email === "string") {
      return { ...parsed, role: isRole(parsed.role) ? parsed.role : undefined } as MockSession;
    }
    return null;
  } catch {
    return null;
  }
}
