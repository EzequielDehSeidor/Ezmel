/**
 * URL pública de la app, para los redirects de login/registro. Si existe
 * NEXT_PUBLIC_SITE_URL se usa esa (recomendado en producción); si no, el origen del request.
 */
export function getSiteUrl(request: Request): string {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  return fixed || new URL(request.url).origin;
}

/** Sólo se permite volver a rutas internas (evita open redirect con `?next=https://otro-sitio`). */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}
