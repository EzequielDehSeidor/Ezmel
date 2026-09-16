const UNIDADES = [
  "",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
];

const DECENAS = [
  "",
  "",
  "veinti",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
];

const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function tresCifras(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";

  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];

  if (c > 0) partes.push(CENTENAS[c]);

  if (resto > 0) {
    if (resto <= 20) {
      partes.push(UNIDADES[resto]);
    } else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      if (d === 2) {
        partes.push(u > 0 ? `veinti${UNIDADES[u]}` : "veinte");
      } else {
        partes.push(u > 0 ? `${DECENAS[d]} y ${UNIDADES[u]}` : DECENAS[d]);
      }
    }
  }

  return partes.join(" ");
}

/** Convierte un entero (0 a 999.999.999) a su forma en letras, en español rioplatense. */
export function numeroALetras(valor: number): string {
  const n = Math.round(Math.abs(valor));
  if (n === 0) return "cero";

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const cientos = n % 1000;

  const partes: string[] = [];

  if (millones > 0) {
    partes.push(millones === 1 ? "un millón" : `${tresCifras(millones)} millones`);
  }

  if (miles > 0) {
    partes.push(miles === 1 ? "mil" : `${tresCifras(miles)} mil`);
  }

  if (cientos > 0) {
    partes.push(tresCifras(cientos));
  }

  return partes.join(" ").replace(/\s+/g, " ").trim();
}

/** "$ 200.000" y su versión en letras: "doscientos mil pesos argentinos". */
export function montoEnLetras(valor: number): string {
  return `${numeroALetras(valor)} pesos argentinos`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function numeroALetrasCapitalizado(valor: number): string {
  return capitalize(numeroALetras(valor));
}
