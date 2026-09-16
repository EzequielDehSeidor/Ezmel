import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { buildContratoContenido, type TextSegment } from "@/lib/contrato/buildContratoBlocks";
import type { ContratoDatos } from "@/lib/types/contrato";

const PAGE_WIDTH = 12240;

/** Título de cláusula en negrita simple, sin caja de color (igual al Word original). */
function heading(text: string) {
  return new Paragraph({
    spacing: { before: 100, after: 60 },
    children: [new TextRun({ text, bold: true, size: 21 })],
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 150, after: 60 }, children: [] });
}

function segmentsToRuns(segments: TextSegment[], size = 21): TextRun[] {
  return segments.map((s) => new TextRun({ text: s.text, bold: s.bold, size }));
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

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: c.titulo, bold: true, size: 32 })],
    }),
    spacer(),
    bodyText(c.intro),
  ];

  for (const clausula of c.clausulas) {
    children.push(spacer(), heading(clausula.titulo), spacer(), bodyText(clausula.texto));
  }

  children.push(spacer(), heading("Firmas"));
  for (const f of c.firmas) {
    children.push(
      new Paragraph({
        spacing: { before: 150 },
        children: [new TextRun({ text: `${f.rol}: __________`, bold: true, size: 21 })],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Nombre completo: ", size: 21 }),
          new TextRun({ text: f.nombre, bold: true, size: 21 }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "DNI: ", size: 21 }),
          new TextRun({ text: f.documento, bold: true, size: 21 }),
        ],
      })
    );
  }

  // Pagaré: en página nueva, con su propio título.
  children.push(
    new Paragraph({ pageBreakBefore: true, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: c.pagare.titulo, bold: true, size: 32 })],
    }),
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: "Por: ", bold: true, size: 21 }), ...segmentsToRuns(c.pagare.por)],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Vence el día: ", bold: true, size: 21 }),
        new TextRun({ text: c.pagare.vence, bold: true, size: 21 }),
      ],
    }),
    new Paragraph({ spacing: { after: 150 }, children: segmentsToRuns(c.pagare.lugar) }),
    bodyText(c.pagare.cuerpo),
    bodyText(c.pagare.interes),
    bodyText(c.pagare.ejecutivo),
    spacer(),
    new Paragraph({ children: [new TextRun({ text: c.pagare.firmanteLabel, bold: true, size: 21 })] }),
    new Paragraph({
      children: [
        new TextRun({ text: "Documento N.º: ", size: 21 }),
        new TextRun({ text: c.pagare.documento, size: 21 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Domicilio: ", size: 21 }),
        new TextRun({ text: c.pagare.domicilio, size: 21 }),
      ],
    }),
    new Paragraph({ spacing: { before: 150 }, children: [new TextRun({ text: "Firma: __________", size: 21 })] })
  );

  const doc = new Document({
    sections: [
      {
        properties: { page: { size: { width: PAGE_WIDTH, height: 15840 } } },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
