import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getServerSession } from "@/lib/auth/session";
import { contratoDatosSchema } from "@/lib/validation/contratoSchema";
import { saveContrato } from "@/lib/data/contratos";
import { generateContratoDocx } from "@/lib/export/toContratoDocx";
import { generateContratoPdf } from "@/lib/export/toContratoPdf";
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
      .replace(/^_+|_+$/g, "") || "contrato"
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const parsedDatos = contratoDatosSchema.safeParse(body.datos);
  if (!parsedDatos.success) {
    return NextResponse.json({ error: "Faltan datos del contrato" }, { status: 400 });
  }

  const formats = (body.formats as ExportFormat[] | undefined)?.filter(
    (f): f is "docx" | "pdf" => f === "docx" || f === "pdf"
  );
  if (!formats || formats.length === 0) {
    return NextResponse.json({ error: "Elegí al menos un formato" }, { status: 400 });
  }

  const session = await getServerSession();
  const record = await saveContrato(parsedDatos.data, session?.email ?? null);

  const baseName = `Contrato_${slugify(parsedDatos.data.mutuarioNombre || record.id)}`;

  const generators: Record<"docx" | "pdf", () => Promise<Buffer>> = {
    docx: () => generateContratoDocx(parsedDatos.data),
    pdf: () => generateContratoPdf(parsedDatos.data),
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
      const buffer = await generators[format]();
      zip.file(`${baseName}.${format}`, buffer);
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
      "X-Contrato-Id": record.id,
    },
  });
}
