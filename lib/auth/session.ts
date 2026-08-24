import { cookies } from "next/headers";
import { isMockMode } from "@/lib/supabase/env";
import { decodeMockSession, MOCK_COOKIE_NAME } from "@/lib/mock/auth";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export interface AppSession {
  email: string;
  mock: boolean;
}

/** Sesión actual, unificada entre modo mock y Supabase real. Uso: Server Components. */
export async function getServerSession(): Promise<AppSession | null> {
  if (isMockMode()) {
    const store = await cookies();
    const session = decodeMockSession(store.get(MOCK_COOKIE_NAME)?.value);
    return session ? { email: session.email, mock: true } : null;
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ? { email: user.email, mock: false } : null;
}
