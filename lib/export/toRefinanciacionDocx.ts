import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer, type Table } from "docx";
import { buildRefinanciacionContenido } from "@/lib/refinanciacion/contenido";
import type { RefinanciacionDatos } from "@/lib/types/refinanciacion";
import { PAGE_WIDTH, datoRun, logoRun, logoTaglineRun, spacer, titleBar } from "./toContratoDocx";

/** Mismo formato que el contrato y el legajo: barra de título, logo con subtítulo, datos en negrita y pie con logo. */
export async function generateRefinanciacionDocx(datos: RefinanciacionDatos): Promise<Buffer> {
  const c = buildRefinanciacionContenido(datos);

  const children: (Paragraph | Table)[] = [
    titleBar(c.titulo),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160 }, children: [logoTaglineRun(200)] }),
    spacer(),
    ...c.campos.map(
      (campo) =>
        new Paragraph({
          spacing: { before: 240 },
          children: [new TextRun({ text: `${campo.label}: `, size: 20 }), datoRun(campo.valor)],
        })
    ),
  ];

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
