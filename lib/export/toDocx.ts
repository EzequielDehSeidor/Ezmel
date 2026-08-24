import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  ImageRun,
  AlignmentType,
} from "docx";
import { CHECKLIST_LABELS, FILE_CATEGORIES } from "@/lib/types/legajo";
import { formatCurrencyAR } from "@/lib/format/currency";
import type { ExportFileData, ExportInput } from "./common";

const LABEL_WIDTH = 3300;
const VALUE_WIDTH = 6780;
const TABLE_WIDTH = LABEL_WIDTH + VALUE_WIDTH;

// Área de contenido aproximada de la página (Carta, márgenes por defecto de docx).
const MAX_IMAGE_WIDTH = 580;
const MAX_IMAGE_HEIGHT = 720;

function cellText(text: string, opts?: { width?: number; bold?: boolean; shaded?: boolean }) {
  return new TableCell({
    width: { size: opts?.width ?? VALUE_WIDTH, type: WidthType.DXA },
    shading: opts?.shaded ? { type: ShadingType.CLEAR, color: "auto", fill: "F1F5F9" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || "—", bold: opts?.bold })],
      }),
    ],
  });
}

function labelValueRow(label: string, value: string) {
  return new TableRow({
    children: [cellText(label, { width: LABEL_WIDTH, bold: true, shaded: true }), cellText(value)],
  });
}

function labelValueTable(rows: [string, string][]) {
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [LABEL_WIDTH, VALUE_WIDTH],
    rows: rows.map(([label, value]) => labelValueRow(label, value)),
  });
}

/** Barra de sección azul marino con texto blanco, igual a la plantilla Word original. */
function heading(text: string) {
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [TABLE_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TABLE_WIDTH, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "17284A" },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: "FFFFFF" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 200, after: 60 }, children: [] });
}

function fitToBox(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

const DOCX_IMAGE_TYPE: Record<string, "png" | "jpg" | "gif" | "bmp"> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

/**
 * Cada categoría arranca en página nueva, con su título y observaciones
 * arriba y la primera imagen debajo (no en una hoja aparte). Las imágenes
 * siguientes sí van una por página, a tamaño grande.
 */
function categoryBlocks(
  index: number,
  title: string,
  images: ExportFileData[] | undefined,
  observaciones: string
): (Paragraph | Table)[] {
  const blocks: (Paragraph | Table)[] = [
    new Paragraph({ pageBreakBefore: true, children: [] }),
    heading(`${index}. ${title}`),
    new Paragraph({
      spacing: { before: 100, after: 100 },
      children: [new TextRun({ text: `Observaciones: ${observaciones || "—"}`, italics: true, size: 20 })],
    }),
  ];

  const usables = (images ?? []).filter((image) => DOCX_IMAGE_TYPE[image.type]);
  if (usables.length === 0) {
    blocks.push(new Paragraph({ children: [new TextRun({ text: "(sin archivos adjuntos)", italics: true })] }));
    return blocks;
  }

  usables.forEach((image, i) => {
    // La primera comparte página con el título; el resto, una por hoja.
    const { width, height } = fitToBox(
      image.width,
      image.height,
      MAX_IMAGE_WIDTH,
      i === 0 ? MAX_IMAGE_HEIGHT - 90 : MAX_IMAGE_HEIGHT
    );
    blocks.push(
      new Paragraph({
        pageBreakBefore: i > 0,
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: image.buffer, type: DOCX_IMAGE_TYPE[image.type], transformation: { width, height } })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: image.caption, italics: true, size: 18, color: "64748B" })],
      })
    );
  });

  return blocks;
}

export async function generateDocx(input: ExportInput): Promise<Buffer> {
  const { data, files } = input;

  // La documentación adjunta va después de los datos, numerada a continuación
  // de "4. Observaciones generales" (5, 6, 7, 8...).
  const attachmentBlocks = FILE_CATEGORIES.flatMap((category, i) =>
    categoryBlocks(5 + i, category.label, files[category.key], data[category.obsKey])
  );

  const children: (Paragraph | Table)[] = [
    heading("Legajo de Cliente"),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new TextRun({ text: "LEGAJO", bold: true, size: 56, color: "17284A" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Carpeta de documentación del cliente", size: 20, italics: true, color: "475569" }),
      ],
    }),

    heading("Datos generales"),
    labelValueTable([
      ["Nombre y Apellido", data.nombreApellido],
      ["N.º de Préstamo", data.numeroPrestamo],
      ["DNI", data.dni],
      ["Fecha de Apertura del Legajo", data.fechaApertura],
    ]),

    spacer(),
    heading("1. Datos personales"),
    labelValueTable([
      ["Nombre", data.nombre],
      ["Apellido", data.apellido],
      ["Teléfono", data.telefono],
      ["Email", data.email],
      ["Dirección", data.direccion],
      ["Código postal", data.codigoPostal],
      ["Referencias", data.referencias],
    ]),

    spacer(),
    heading("2. Monto de préstamo"),
    labelValueTable([["Monto de Préstamo", formatCurrencyAR(data.montoPrestamo)]]),

    spacer(),
    heading("3. Servicios"),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [2000, 2900, 1800, 3380],
      rows: [
        new TableRow({
          children: ["Servicio", "Titular", "Fecha", "Observaciones"].map((h, i) =>
            cellText(h, { width: [2000, 2900, 1800, 3380][i], bold: true, shaded: true })
          ),
        }),
        ...data.servicios.map(
          (row) =>
            new TableRow({
              children: [
                cellText(row.servicio, { width: 2000, bold: true }),
                cellText(row.titular, { width: 2900 }),
                cellText(row.fecha, { width: 1800 }),
                cellText(row.observaciones, { width: 3380 }),
              ],
            })
        ),
      ],
    }),

    spacer(),
    heading("4. Observaciones generales"),
    new Paragraph({ children: [new TextRun({ text: data.observacionesGenerales || "—" })] }),

    // Documentación adjunta (secciones 5 en adelante).
    ...attachmentBlocks,

    // Cierre del legajo en su propia hoja: checklist y, debajo, el responsable.
    new Paragraph({ pageBreakBefore: true, children: [] }),
    heading("Checklist final"),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [TABLE_WIDTH - 1500, 1500],
      rows: (Object.keys(CHECKLIST_LABELS) as (keyof typeof CHECKLIST_LABELS)[]).map(
        (key) =>
          new TableRow({
            children: [
              cellText(CHECKLIST_LABELS[key], { width: TABLE_WIDTH - 1500 }),
              cellText(data.checklist[key] ? "Sí" : "No", { width: 1500 }),
            ],
          })
      ),
    }),

    spacer(),
    heading("Responsable del legajo"),
    labelValueTable([
      ["Responsable", data.responsable],
      ["Fecha", data.fechaResponsable],
    ]),
  ];

  const doc = new Document({
    sections: [
      {
        properties: { page: { size: { width: 12240, height: 15840 } } },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
