import Image from "next/image";
import { CHECKLIST_LABELS, FILE_CATEGORIES } from "@/lib/types/legajo";
import { formatCurrencyAR } from "@/lib/format/currency";
import type { LegajoFileCategoryKey, LegajoFormValues } from "@/lib/types/legajo";
import { AttachmentPreview } from "./AttachmentPreview";

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <tr>
      <td className="w-64 border border-[#c3dadb] bg-[#eaf4f4] px-3 py-2 font-bold text-[#1a5f6f]">
        {label}
      </td>
      <td className="border border-[#c3dadb] px-3 py-2 text-slate-900">{value || "—"}</td>
    </tr>
  );
}

/** Barra de sección azul marino, igual a la plantilla Word del legajo. */
function SectionBar({ children, tight = false }: { children: React.ReactNode; tight?: boolean }) {
  return (
    <h3
      className={`mb-3 ${tight ? "mt-4" : "mt-8"} bg-[#1a5f6f] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white`}
    >
      {children}
    </h3>
  );
}

export function LegajoDocumentPreview({
  data,
  files,
}: {
  data: LegajoFormValues;
  files: Partial<Record<LegajoFileCategoryKey, File[]>>;
}) {
  const serviciosConDatos = data.servicios.filter((s) =>
    [s.titular, s.fecha, s.observaciones].some((v) => v?.trim())
  );

  return (
    <div className="mx-auto max-w-3xl border border-[#c3dadb] bg-white p-10 shadow-sm">
      <div className="bg-[#1a5f6f] px-4 py-2 text-center text-sm font-bold uppercase tracking-[0.2em] text-white">
        Legajo de Cliente
      </div>
      <h1 className="mt-3">
        <Image src="/logo-tagline.png" alt="EzMel, servicios financieros" width={1200} height={436} unoptimized className="mx-auto h-auto w-[220px]" />
      </h1>
      <p className="text-center text-sm italic text-slate-600">
        Carpeta de documentación del cliente
      </p>

      <SectionBar tight>Datos generales</SectionBar>
      <table className="w-full border-collapse text-sm">
        <tbody>
          <Row label="Nombre y Apellido" value={data.nombreApellido} />
          <Row label="N.º de Préstamo" value={data.numeroPrestamo} />
          <Row label="DNI" value={data.dni} />
          <Row label="Fecha de Apertura del Legajo" value={data.fechaApertura} />
        </tbody>
      </table>

      <SectionBar>Datos personales</SectionBar>
      <table className="w-full border-collapse text-sm">
        <tbody>
          <Row label="Nombre" value={data.nombre} />
          <Row label="Apellido" value={data.apellido} />
          <Row label="Teléfono" value={data.telefono} />
          <Row label="Email" value={data.email} />
          <Row label="Dirección" value={data.direccion} />
          <Row label="Código postal" value={data.codigoPostal} />
          <Row label="Referencias" value={data.referencias} />
        </tbody>
      </table>

      <SectionBar>Monto de préstamo</SectionBar>
      <table className="w-full border-collapse text-sm">
        <tbody>
          <Row label="Monto de Préstamo" value={formatCurrencyAR(data.montoPrestamo)} />
        </tbody>
      </table>

      {serviciosConDatos.length > 0 && (
        <>
          <SectionBar>Servicios</SectionBar>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Servicio", "Titular", "Fecha", "Observaciones"].map((h) => (
                  <th
                    key={h}
                    className="border border-[#c3dadb] bg-[#eaf4f4] px-3 py-1.5 text-left font-bold text-[#1a5f6f]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serviciosConDatos.map((row) => (
                <tr key={row.servicio}>
                  <td className="border border-[#c3dadb] px-3 py-1.5 font-semibold text-slate-900">
                    {row.servicio}
                  </td>
                  <td className="border border-[#c3dadb] px-3 py-1.5 text-slate-900">{row.titular || "—"}</td>
                  <td className="border border-[#c3dadb] px-3 py-1.5 text-slate-900">{row.fecha || "—"}</td>
                  <td className="border border-[#c3dadb] px-3 py-1.5 text-slate-900">
                    {row.observaciones || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <SectionBar>Observaciones generales</SectionBar>
      <p className="whitespace-pre-wrap text-sm text-slate-900">{data.observacionesGenerales || "—"}</p>

      {/* Documentación adjunta: cada categoría con su título real. */}
      {FILE_CATEGORIES.map((category) => (
        <CategoryBlock
          key={category.key}
          title={category.label}
          files={files[category.key] ?? []}
          observaciones={data[category.obsKey]}
        />
      ))}

      <SectionBar>Checklist final</SectionBar>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {(Object.keys(CHECKLIST_LABELS) as (keyof typeof CHECKLIST_LABELS)[]).map((key) => (
            <tr key={key}>
              <td className="border border-[#c3dadb] px-3 py-2 text-slate-900">{CHECKLIST_LABELS[key]}</td>
              <td className="w-16 border border-[#c3dadb] px-3 py-2 text-center text-[#1a5f6f]">
                {data.checklist[key] ? "☑" : "☐"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionBar>Responsable del legajo</SectionBar>
      <table className="w-full border-collapse text-sm">
        <tbody>
          <Row label="Responsable" value={data.responsable} />
          <Row label="Fecha" value={data.fechaResponsable} />
        </tbody>
      </table>
    </div>
  );
}

function CategoryBlock({
  title,
  files,
  observaciones,
}: {
  title: string;
  files: File[];
  observaciones: string;
}) {
  return (
    <div>
      <SectionBar>
        {title}
      </SectionBar>
      <p className="mb-3 text-sm text-slate-700">
        <span className="font-semibold text-[#1a5f6f]">Observaciones:</span>{" "}
        {observaciones || "Sin observaciones"}
      </p>

      {files.length === 0 ? (
        <p className="text-sm italic text-slate-500">(sin archivos adjuntos)</p>
      ) : (
        <div className="space-y-4">
          {files.map((file, i) => (
            <AttachmentPreview key={`${file.name}-${file.lastModified}-${i}`} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
