import type { RefinanciacionDatos } from "@/lib/types/refinanciacion";

export interface RefinanciacionContenido {
  titulo: string;
  campos: { label: string; valor: string }[];
}

/** "2026-10-05" -> "05/10/2026". */
function fechaDMY(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Contenido del documento de refinanciación; lo comparten la vista previa, el Word y el PDF. */
export function buildRefinanciacionContenido(datos: RefinanciacionDatos): RefinanciacionContenido {
  return {
    titulo: "REFINANCIACIÓN",
    campos: [
      { label: "Nombre", valor: datos.nombre },
      { label: "Apellido", valor: datos.apellido },
      { label: "Fecha de refinanciación", valor: fechaDMY(datos.fechaRefinanciacion) },
    ],
  };
}
