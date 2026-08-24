import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isMockMode } from "./env";

/** Cliente de Supabase para Client Components. No llamar en modo mock. */
export function createClient() {
  if (isMockMode()) {
    throw new Error("createClient() no debe usarse en modo mock (falta configurar Supabase)");
  }
  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}
