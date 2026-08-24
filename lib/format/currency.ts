/** Formato de moneda argentino: punto para miles, coma para decimales. */
const AR_FORMATTER = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrencyAR(value: number): string {
  return `$ ${AR_FORMATTER.format(value || 0)}`;
}

/** "3.000.000,50" -> 3000000.5. Ignora todo lo que no sea dígito, punto o coma. */
export function parseCurrencyAR(raw: string): number {
  const cleaned = raw.replace(/[^\d,]/g, "").replace(",", ".");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

/** Texto para mostrar dentro del input mientras se edita (sin el "$"). */
export function formatAmountInput(value: number): string {
  if (!value) return "";
  return AR_FORMATTER.format(value);
}
