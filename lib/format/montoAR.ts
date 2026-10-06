/**
 * Interpreta un monto escrito en formato argentino: el punto separa miles y la coma los decimales.
 * "100000" = "100.000" = 100000 · "100,90" = 100.9 · "1.000,90" = 1000.9
 * Devuelve undefined si está vacío o no se puede interpretar.
 */
export function parseMontoAR(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;

  const s = value.trim().replace(/\s+/g, "").replace(/^\$/, "");
  if (!s) return undefined;

  if (s.includes(",")) {
    if (!/^(\d{1,3}(\.\d{3})+|\d+),\d{1,2}$/.test(s)) return undefined;
    return Number(s.replace(/\./g, "").replace(",", "."));
  }

  if (s.includes(".")) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ""));
    if (/^\d+\.\d{1,2}$/.test(s)) return Number(s);
    return undefined;
  }

  return /^\d+$/.test(s) ? Number(s) : undefined;
}
