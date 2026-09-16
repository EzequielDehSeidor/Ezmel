import { buildContratoContenido, type TextSegment } from "@/lib/contrato/buildContratoBlocks";
import type { ContratoDatosSchema } from "@/lib/validation/contratoSchema";

function SectionBar({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 mt-5 text-sm font-bold text-slate-900">{children}</h3>;
}

function Segments({ segments }: { segments: TextSegment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.bold ? (
          <strong key={i} className="font-bold">
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
    <div
      className="mx-auto max-w-3xl border border-slate-300 bg-white p-10 shadow-sm"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <h1 className="text-center text-xl font-bold text-slate-900">{c.titulo}</h1>

      <p className="mt-6 whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-800">
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

      <SectionBar>Firmas</SectionBar>
      <div className="space-y-4">
        {c.firmas.map((f) => (
          <div key={f.rol} className="text-sm text-slate-800">
            <p className="font-semibold text-[#17284a]">{f.rol}: __________</p>
            <p>
              Nombre completo: <strong className="font-bold">{f.nombre}</strong>
            </p>
            <p>
              DNI: <strong className="font-bold">{f.documento}</strong>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t-4 border-double border-[#17284a] pt-6">
        <h1 className="text-center text-xl font-bold text-slate-900">{c.pagare.titulo}</h1>
        <p className="mt-4 text-sm text-slate-800">
          <span className="font-semibold">Por:</span> <Segments segments={c.pagare.por} />
        </p>
        <p className="text-sm text-slate-800">
          <span className="font-semibold">Vence el día:</span>{" "}
          <strong className="font-bold">{c.pagare.vence}</strong>
        </p>
        <p className="mb-4 text-sm text-slate-800">
          <Segments segments={c.pagare.lugar} />
        </p>

        <p className="whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-800">
          <Segments segments={c.pagare.cuerpo} />
        </p>
        <p className="mt-3 whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-800">
          <Segments segments={c.pagare.interes} />
        </p>
        <p className="mt-3 whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-800">
          <Segments segments={c.pagare.ejecutivo} />
        </p>

        <div className="mt-6 text-sm text-slate-800">
          <p className="font-semibold text-[#17284a]">{c.pagare.firmanteLabel}</p>
          <p>Documento N.º: {c.pagare.documento}</p>
          <p>Domicilio: {c.pagare.domicilio}</p>
          <p className="mt-2">Firma: __________</p>
        </div>
      </div>
    </div>
  );
}
