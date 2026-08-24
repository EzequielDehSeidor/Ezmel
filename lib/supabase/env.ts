export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Modo mock: activo automáticamente mientras no haya credenciales de Supabase
 * cargadas en `.env.local`. Ver README.md para pasar a modo real.
 */
export function isMockMode(): boolean {
  return !SUPABASE_URL || !SUPABASE_ANON_KEY;
}
