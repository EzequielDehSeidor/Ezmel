import Image from "next/image";
import { buildRefinanciacionContenido } from "@/lib/refinanciacion/contenido";
import type { RefinanciacionSchema } from "@/lib/validation/refinanciacionSchema";

const HOJA_CLASS = "mx-auto max-w-3xl border border-slate-300 bg-white p-10 shadow-sm";
const TITULO_CLASS =
  "bg-[#1a5f6f] px-4 py-3 text-center text-[21px] font-bold uppercase tracking-wide text-white";

/** Vista previa con el mismo formato que el contrato y el legajo; muestra solo los datos cargados. */
export function RefinanciacionPreview({ datos }: { datos: RefinanciacionSchema }) {
  const c = buildRefinanciacionContenido(datos);

  return (
    <div className={HOJA_CLASS} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <h1 className={TITULO_CLASS}>{c.titulo}</h1>
      <Image
        src="/logo-tagline.png"
        alt="EzMel, servicios financieros"
        width={1200}
        height={436}
        unoptimized
        className="mx-auto mt-5 h-auto w-[220px]"
      />

      <div className="mt-6 space-y-4 text-sm text-slate-800">
        {c.campos.map((campo) => (
          <p key={campo.label}>
            {campo.label}: <strong className="text-[15px] font-bold text-black">{campo.valor}</strong>
          </p>
        ))}
      </div>
    </div>
  );
}
