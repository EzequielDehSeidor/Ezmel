/** "36315016" -> "36.315.016". Si no parece un DNI (7 a 9 dígitos), lo devuelve como estaba. */
export function formatDni(value: string): string {
  const texto = value.trim();
  const digitos = texto.replace(/\D/g, "");
  if (digitos.length < 7 || digitos.length > 9) return texto;
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const CONECTORES = new Set(["de", "del", "la", "las", "los", "el", "y", "e", "en", "a"]);

/**
 * Ordena mayúsculas y espacios del domicilio: "el portico   126" -> "El Portico 126".
 * Las palabras que ya traen mayúsculas (CABA, B°, PB) se dejan como están.
 */
export function formatDomicilio(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((palabra, i) => {
      if (/[A-ZÁÉÍÓÚÑ]/.test(palabra)) return palabra;
      if (i > 0 && CONECTORES.has(palabra)) return palabra;
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(" ");
}
