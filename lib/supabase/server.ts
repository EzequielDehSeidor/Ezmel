import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isMockMode } from "./env";

/** Cliente de Supabase para Server Components / Route Handlers / Server Actions. */
export async function createClient() {
  if (isMockMode()) {
    throw new Error("createClient() no debe usarse en modo mock (falta configurar Supabase)");
  }
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // set() puede fallar si se llama desde un Server Component; se ignora
          // porque el middleware ya se encarga de refrescar la sesión.
        }
      },
    },
  });
}
