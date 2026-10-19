import { NextResponse } from "next/server";
import JSZip from "jszip";
import { refinanciacionSchema } from "@/lib/validation/refinanciacionSchema";
import { generateRefinanciacionDocx } from "@/lib/export/toRefinanciacionDocx";
import { generateRefinanciacionPdf } from "@/lib/export/toRefinanciacionPdf";
import type { ExportFormat } from "@/lib/types/legajo";

const MIME_BY_FORMAT: Record<"docx" | "pdf", string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "refinanciacion"
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const parsed = refinanciacionSchema.safeParse(body.datos);
  if (!parsed.success) {
    return NextResponse.json({ error: "Faltan datos de la refinanciación" }, { status: 400 });
  }

  const formats = (body.formats as ExportFormat[] | undefined)?.filter(
    (f): f is "docx" | "pdf" => f === "docx" || f === "pdf"
  );
  if (!formats || formats.length === 0) {
    return NextResponse.json({ error: "Elegí al menos un formato" }, { status: 400 });
  }

  const baseName = `Refinanciacion_${slugify(`${parsed.data.nombre} ${parsed.data.apellido}`)}`;

  const generators: Record<"docx" | "pdf", () => Promise<Buffer>> = {
    docx: () => generateRefinanciacionDocx(parsed.data),
    pdf: () => generateRefinanciacionPdf(parsed.data),
  };

  let bodyBuffer: Buffer;
  let contentType: string;
  let filename: string;

  if (formats.length === 1) {
    const format = formats[0];
    bodyBuffer = await generators[format]();
    contentType = MIME_BY_FORMAT[format];
    filename = `${baseName}.${format}`;
  } else {
    const zip = new JSZip();
    for (const format of formats) {
      zip.file(`${baseName}.${format}`, await generators[format]());
    }
    bodyBuffer = await zip.generateAsync({ type: "nodebuffer" });
    contentType = "application/zip";
    filename = `${baseName}.zip`;
  }

  return new NextResponse(new Uint8Array(bodyBuffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
