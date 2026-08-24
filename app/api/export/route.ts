import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getServerSession } from "@/lib/auth/session";
import { legajoFormSchema } from "@/lib/validation/legajoSchema";
import { FILE_CATEGORIES } from "@/lib/types/legajo";
import type { ExportFormat } from "@/lib/types/legajo";
import { saveLegajo, type FileUpload } from "@/lib/data/legajos";
import { generateDocx } from "@/lib/export/toDocx";
import { generateXlsx } from "@/lib/export/toXlsx";
import { generatePdf } from "@/lib/export/toPdf";
import type { AttachmentMeta, ExportInput } from "@/lib/export/common";

const MIME_BY_FORMAT: Record<ExportFormat, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "legajo"
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const rawData = formData.get("data");
  const rawFormats = formData.get("formats");
  if (typeof rawData !== "string" || typeof rawFormats !== "string") {
    return NextResponse.json({ error: "Faltan datos del legajo" }, { status: 400 });
  }

  const parsedData = legajoFormSchema.safeParse(JSON.parse(rawData));
  if (!parsedData.success) {
    return NextResponse.json({ error: "Datos del legajo inválidos" }, { status: 400 });
  }

  const formats = (JSON.parse(rawFormats) as string[]).filter(
    (f): f is ExportFormat => f === "docx" || f === "pdf" || f === "xlsx"
  );
  if (formats.length === 0) {
    return NextResponse.json({ error: "Elegí al menos un formato" }, { status: 400 });
  }

  // El cliente manda un `meta` por adjunto (leyenda y tamaño), en el mismo
  // orden en que agregó los archivos de cada categoría.
  const rawMeta = formData.get("meta");
  const meta: AttachmentMeta[] = typeof rawMeta === "string" ? JSON.parse(rawMeta) : [];

  const fileUploads: FileUpload[] = [];
  const filesByKey: ExportInput["files"] = {};

  for (const category of FILE_CATEGORIES) {
    const entries = formData.getAll(category.key).filter((e): e is File => e instanceof File);
    const categoryMeta = meta.filter((m) => m.category === category.key);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const buffer = Buffer.from(await entry.arrayBuffer());
      const info = categoryMeta[i];

      fileUploads.push({ key: category.key, name: entry.name, type: entry.type, buffer });
      (filesByKey[category.key] ??= []).push({
        caption: info?.caption ?? entry.name,
        type: entry.type,
        width: info?.width ?? 800,
        height: info?.height ?? 600,
        buffer,
      });
    }
  }

  const input: ExportInput = { data: parsedData.data, files: filesByKey };

  const session = await getServerSession();
  const record = await saveLegajo(parsedData.data, fileUploads, session?.email ?? null);

  const baseName = `Legajo_${slugify(parsedData.data.nombreApellido || parsedData.data.dni || record.id)}`;

  const generators: Record<ExportFormat, () => Promise<Buffer>> = {
    docx: () => generateDocx(input),
    pdf: () => generatePdf(input),
    xlsx: () => generateXlsx(input),
  };

  let body: Buffer;
  let contentType: string;
  let filename: string;

  if (formats.length === 1) {
    const format = formats[0];
    body = await generators[format]();
    contentType = MIME_BY_FORMAT[format];
    filename = `${baseName}.${format}`;
  } else {
    const zip = new JSZip();
    for (const format of formats) {
      const buffer = await generators[format]();
      zip.file(`${baseName}.${format}`, buffer);
    }
    body = await zip.generateAsync({ type: "nodebuffer" });
    contentType = "application/zip";
    filename = `${baseName}.zip`;
  }

  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Legajo-Id": record.id,
    },
  });
}
