import Image from "next/image";
import {
  buildContratoContenido,
  LINEA_DNI,
  LINEA_NOMBRE,
  type TextSegment,
} from "@/lib/contrato/buildContratoBlocks";
import type { ContratoDatosSchema } from "@/lib/validation/contratoSchema";

const HOJA_CLASS = "mx-auto max-w-3xl border border-slate-300 bg-white p-10 shadow-sm";
const TITULO_CLASS =
  "bg-[#1a5f6f] px-4 py-3 text-center text-[21px] font-bold uppercase tracking-wide text-white";
const DATO_CLASS = "text-[15px] font-bold text-black";

function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-6 bg-[#1a5f6f] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
      {children}
    </h3>
  );
}

function Segments({ segments }: { segments: TextSegment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.bold ? (
          <strong key={i} className={DATO_CLASS}>
            {s.text}
          </strong>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </>
  );
}

export function ContratoPreview({ datos }: { datos: ContratoDatosSchema }) {
  const c = buildContratoContenido(datos);

  return (
    <div className={HOJA_CLASS} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div>
        <h1 className={TITULO_CLASS}>{c.titulo}</h1>
        <Image src="/logo-tagline.png" alt="EzMel, servicios financieros" width={1200} height={436} unoptimized className="mx-auto mt-5 h-auto w-[220px]" />

        <p className="mt-6 text-sm text-slate-800">
          <Segments segments={c.numero} />
        </p>
        <p className="mt-3 whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-800">
          <Segments segments={c.intro} />
        </p>

        {c.clausulas.map((cl) => (
          <div key={cl.titulo}>
            <SectionBar>{cl.titulo}</SectionBar>
            <p className="whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-800">
              <Segments segments={cl.texto} />
            </p>
          </div>
        ))}

        <p className="mt-6 whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-800">
          <Segments segments={c.cierre} />
        </p>

        <SectionBar>Firmas</SectionBar>
        <div className="space-y-12" style={{ marginTop: 40 }}>
          {c.firmas.map((f) => (
            <div key={f.rol} className="text-sm text-slate-800">
              <p className="font-semibold text-[#1a5f6f]">
                {f.rol}: {LINEA_DNI}
              </p>
              <p style={{ marginTop: 37 }}>
                Nombre completo: <strong className={DATO_CLASS}>{f.nombre || LINEA_NOMBRE}</strong>
              </p>
              <p style={{ marginTop: 37 }}>
                DNI: <strong className={DATO_CLASS}>{f.documento || LINEA_DNI}</strong>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 border-t-4 border-double border-[#1a5f6f] pt-6">
        <h1 className={TITULO_CLASS}>{c.pagare.titulo}</h1>
        <p className="mt-2 text-center text-sm text-slate-800">{c.pagare.subtitulo}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm text-slate-800">
          <Segments segments={c.pagare.encabezado} />
        </p>
        <p className="mt-1 text-sm text-slate-800">
          <Segments segments={c.pagare.por} />
        </p>

        <p className="mt-4 whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-800">
          <Segments segments={c.pagare.cuerpo} />
        </p>
        <p className="mt-3 whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-800">
          <Segments segments={c.pagare.valor} />
        </p>
        <p className="mt-3 whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-800">
          <Segments segments={c.pagare.lugarFecha} />
        </p>

        <div className="mt-12 flex flex-col text-sm text-slate-800" style={{ gap: 37 }}>
          <p className="font-semibold text-[#1a5f6f]">
            {c.pagare.firmanteLabel} {LINEA_NOMBRE}
          </p>
          <p>
            Nombre y apellido: <strong className={DATO_CLASS}>{c.pagare.nombre || LINEA_NOMBRE}</strong>
          </p>
          <p>
            DNI N°: <strong className={DATO_CLASS}>{c.pagare.documento || LINEA_DNI}</strong>
          </p>
          <p>
            Domicilio: <strong className={DATO_CLASS}>{c.pagare.domicilio || LINEA_NOMBRE}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
