import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, ImageRun, Footer } from "docx";
import { LOGO_ASPECT, LOGO_PNG, LOGO_TAGLINE_ASPECT, LOGO_TAGLINE_PNG } from "@/lib/brand/logo";
import {
  buildContratoContenido,
  LINEA_DNI,
  LINEA_NOMBRE,
  type TextSegment,
} from "@/lib/contrato/buildContratoBlocks";
import type { ContratoDatos } from "@/lib/types/contrato";

const PAGE_WIDTH = 12240;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * 1440;

/** Barra de sección azul marino con texto blanco, igual al estilo de la página. */
function heading(text: string) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "1A5F6F" },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                keepNext: true,
                children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 20, color: "FFFFFF" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/** Título principal (CONTRATO DE MUTUO / PAGARÉ): barra azul marino centrada con texto blanco. */
function titleBar(text: string) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "1A5F6F" },
            margins: { top: 140, bottom: 140, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 32, color: "FFFFFF" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/** Logo con el subtítulo "Servicios financieros" debajo, para el encabezado. */
function logoTaglineRun(widthPx: number) {
  return new ImageRun({
    type: "png",
    data: LOGO_TAGLINE_PNG,
    transformation: { width: widthPx, height: Math.round(widthPx / LOGO_TAGLINE_ASPECT) },
  });
}

function logoRun(widthPx: number) {
  return new ImageRun({
    type: "png",
    data: LOGO_PNG,
    transformation: { width: widthPx, height: Math.round(widthPx / LOGO_ASPECT) },
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 150, after: 60 }, children: [] });
}

const DATO_SIZE = 22;

/** Datos completados: negro puro y un punto más grandes que el texto fijo. */
function datoRun(text: string) {
  return new TextRun({ text, bold: true, size: DATO_SIZE, color: "000000" });
}

function segmentsToRuns(segments: TextSegment[], size = 20): TextRun[] {
  return segments.map((s) => (s.bold ? datoRun(s.text) : new TextRun({ text: s.text, size })));
}

function bodyText(segments: TextSegment[]) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 100 },
    children: segmentsToRuns(segments),
  });
}

export async function generateContratoDocx(datos: ContratoDatos): Promise<Buffer> {
  const c = buildContratoContenido(datos);

  const children: (Paragraph | Table)[] = [
    titleBar(c.titulo),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160 }, children: [logoTaglineRun(200)] }),
    spacer(),
    bodyText(c.intro),
  ];

  for (const clausula of c.clausulas) {
    children.push(spacer(), heading(clausula.titulo), spacer(), bodyText(clausula.texto));
  }

  children.push(spacer(), heading("Firmas"));
  // keepNext encadena todo el bloque de firmas para que no se parta entre hojas.
  for (const [i, f] of c.firmas.entries()) {
    children.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: i === 0 ? 550 : 150 },
        children: [new TextRun({ text: `${f.rol}: ${LINEA_DNI}`, bold: true, size: 20 })],
      }),
      new Paragraph({
        keepNext: true,
        spacing: { before: 455 },
        children: [
          new TextRun({ text: "Nombre completo: ", size: 20 }),
          datoRun(f.nombre || LINEA_NOMBRE),
        ],
      }),
      new Paragraph({
        keepNext: i < c.firmas.length - 1,
        spacing: { before: 455, after: 400 },
        children: [
          new TextRun({ text: "DNI: ", size: 20 }),
          datoRun(f.documento || LINEA_DNI),
        ],
      })
    );
  }

  // Pagaré: en página nueva, con su propio título.
  children.push(
    new Paragraph({ pageBreakBefore: true, children: [] }),
    titleBar(c.pagare.titulo),
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: "Por: ", bold: true, size: 20 }), ...segmentsToRuns(c.pagare.por)],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Vence el día: ", bold: true, size: 20 }),
        datoRun(c.pagare.vence),
      ],
    }),
    new Paragraph({ spacing: { after: 150 }, children: segmentsToRuns(c.pagare.lugar) }),
    bodyText(c.pagare.cuerpo),
    bodyText(c.pagare.interes),
    bodyText(c.pagare.ejecutivo),
    spacer(),
    new Paragraph({
      spacing: { before: 555 },
      children: [new TextRun({ text: `${c.pagare.firmanteLabel} ${LINEA_NOMBRE}`, bold: true, size: 20 })],
    }),
    new Paragraph({
      spacing: { before: 555 },
      children: [
        new TextRun({ text: "Documento N.º: ", size: 20 }),
        datoRun(c.pagare.documento || LINEA_DNI),
      ],
    }),
    new Paragraph({
      spacing: { before: 555 },
      children: [
        new TextRun({ text: "Domicilio: ", size: 20 }),
        datoRun(c.pagare.domicilio || LINEA_NOMBRE),
      ],
    }),
    new Paragraph({
      spacing: { before: 555 },
      children: [new TextRun({ text: `Firma: ${LINEA_DNI}`, size: 20 })],
    })
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial" } } } },
    sections: [
      {
        properties: { page: { size: { width: PAGE_WIDTH, height: 15840 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [logoRun(90)] }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "SERVICIOS FINANCIEROS", size: 11, color: "1B4558", characterSpacing: 24 })],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
