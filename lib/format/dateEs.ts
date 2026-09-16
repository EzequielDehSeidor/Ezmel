const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Parsea "YYYY-MM-DD" (lo que devuelve un <input type="date">) sin líos de huso horario. */
function parseFechaISO(iso: string): { dia: number; mes: number; anio: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { anio: Number(match[1]), mes: Number(match[2]) - 1, dia: Number(match[3]) };
}

/** "2026-10-05" -> "05 de octubre de 2026" */
export function formatFechaLarga(iso: string): string {
  const f = parseFechaISO(iso);
  if (!f) return iso;
  return `${String(f.dia).padStart(2, "0")} de ${MESES[f.mes]} de ${f.anio}`;
}

export interface FechaPartes {
  dia: string;
  mes: string;
  anio: string;
}

/** "2026-08-27" -> { dia: "27", mes: "Agosto", anio: "2026" } */
export function fechaPartes(iso: string): FechaPartes {
  const f = parseFechaISO(iso);
  if (!f) return { dia: "", mes: "", anio: "" };
  const mes = MESES[f.mes];
  return {
    dia: String(f.dia).padStart(2, "0"),
    anio: String(f.anio),
    mes: mes.charAt(0).toUpperCase() + mes.slice(1),
  };
}
