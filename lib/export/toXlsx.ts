import ExcelJS from "exceljs";
import { CHECKLIST_LABELS, FILE_CATEGORIES } from "@/lib/types/legajo";
import type { ExportFileData, ExportInput } from "./common";

/** Barra de sección azul marino con texto blanco, igual a la plantilla Word. */
function sectionRow(sheet: ExcelJS.Worksheet, title: string) {
  const row = sheet.addRow([title.toUpperCase()]);
  sheet.mergeCells(row.number, 1, row.number, 4);
  row.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17284A" } };
}

function labelValueRow(sheet: ExcelJS.Worksheet, label: string, value: string | number) {
  const row = sheet.addRow([label, value]);
  row.getCell(1).font = { bold: true, color: { argb: "FF17284A" } };
  row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2F9" } };
}

function categoryRows(
  sheet: ExcelJS.Worksheet,
  label: string,
  files: ExportFileData[] | undefined,
  observaciones: string
) {
  const list = files ?? [];
  // Cada entrada ya es una imagen; los PDF llegan expandidos página por página.
  const descriptions = list.length > 0 ? list.map((f) => f.caption) : ["(sin archivos)"];
  labelValueRow(sheet, `${label} — archivos`, descriptions.join("; "));
  labelValueRow(sheet, `${label} — observaciones`, observaciones || "—");
}

export async function generateXlsx(input: ExportInput): Promise<Buffer> {
  const { data, files } = input;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Legajo");
  sheet.columns = [{ width: 34 }, { width: 60 }, { width: 18 }, { width: 34 }];

  sectionRow(sheet, "Datos generales");
  labelValueRow(sheet, "Nombre y Apellido", data.nombreApellido);
  labelValueRow(sheet, "N.º de Préstamo", data.numeroPrestamo);
  labelValueRow(sheet, "DNI", data.dni);
  labelValueRow(sheet, "Fecha de Apertura del Legajo", data.fechaApertura);

  sectionRow(sheet, "1. Datos personales");
  labelValueRow(sheet, "Nombre", data.nombre);
  labelValueRow(sheet, "Apellido", data.apellido);
  labelValueRow(sheet, "Teléfono", data.telefono);
  labelValueRow(sheet, "Email", data.email);
  labelValueRow(sheet, "Dirección", data.direccion);
  labelValueRow(sheet, "Código postal", data.codigoPostal);
  labelValueRow(sheet, "Referencias", data.referencias);

  sectionRow(sheet, "2. Monto de préstamo");
  labelValueRow(sheet, "Monto de Préstamo", Number(data.montoPrestamo || 0));

  sectionRow(sheet, "3. Servicios");
  const serviciosHeader = sheet.addRow(["Servicio", "Titular", "Fecha", "Observaciones"]);
  serviciosHeader.font = { bold: true, color: { argb: "FF17284A" } };
  serviciosHeader.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2F9" } };
  });
  data.servicios.forEach((s) => sheet.addRow([s.servicio, s.titular, s.fecha, s.observaciones]));

  sectionRow(sheet, "4. Observaciones generales");
  sheet.addRow([data.observacionesGenerales || "—"]);

  // Documentación adjunta (secciones 5 en adelante).
  for (let i = 0; i < FILE_CATEGORIES.length; i++) {
    const category = FILE_CATEGORIES[i];
    sectionRow(sheet, `${5 + i}. ${category.label}`);
    categoryRows(sheet, category.label, files[category.key], data[category.obsKey]);
  }

  sectionRow(sheet, "Checklist final");
  (Object.keys(CHECKLIST_LABELS) as (keyof typeof CHECKLIST_LABELS)[]).forEach((key) =>
    labelValueRow(sheet, CHECKLIST_LABELS[key], data.checklist[key] ? "Sí" : "No")
  );

  sectionRow(sheet, "Responsable del legajo");
  labelValueRow(sheet, "Responsable", data.responsable);
  labelValueRow(sheet, "Fecha", data.fechaResponsable);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
