import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { CHECKLIST_LABELS, FILE_CATEGORIES } from "@/lib/types/legajo";
import type { ExportFileData, ExportInput } from "./common";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  bannerBar: {
    backgroundColor: "#17284a",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
    padding: 6,
    letterSpacing: 2,
  },
  title: { fontSize: 28, fontWeight: 700, color: "#17284a", textAlign: "center", marginTop: 12 },
  subtitle: { fontSize: 10, color: "#475569", textAlign: "center", marginBottom: 8 },
  heading: {
    fontSize: 10,
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#17284a",
    marginTop: 16,
    marginBottom: 6,
    padding: 6,
  },
  row: { flexDirection: "row", borderBottom: "0.5pt solid #c8d3e6" },
  labelCell: { width: "35%", backgroundColor: "#eef2f9", padding: 5, fontWeight: 700, color: "#17284a" },
  valueCell: { width: "65%", padding: 5 },
  tableHeaderCell: { padding: 5, fontWeight: 700, backgroundColor: "#eef2f9", color: "#17284a" },
  tableCell: { padding: 5 },
  imagePage: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrap: { display: "flex", flexDirection: "column", alignItems: "center", marginTop: 10 },
  imageCaption: { marginTop: 10, fontSize: 9, color: "#64748b", textAlign: "center" },
});

function LabelValueTable({ rows }: { rows: [string, string][] }) {
  return (
    <View>
      {rows.map(([label, value]) => (
        <View style={styles.row} key={label}>
          <Text style={styles.labelCell}>{label}</Text>
          <Text style={styles.valueCell}>{value || "—"}</Text>
        </View>
      ))}
    </View>
  );
}

// Área de contenido aproximada de una página A4 con padding de 24pt.
const MAX_WIDTH_PT = 500;
const MAX_HEIGHT_PT = 700;
const PX_TO_PT = 0.75;

function fitToBox(widthPx: number, heightPx: number, maxHeightPt = MAX_HEIGHT_PT) {
  const widthPt = widthPx * PX_TO_PT;
  const heightPt = heightPx * PX_TO_PT;
  const scale = Math.min(MAX_WIDTH_PT / widthPt, maxHeightPt / heightPt, 1);
  return { width: widthPt * scale, height: heightPt * scale };
}

const PDF_IMAGE_FORMAT: Record<string, "png" | "jpg"> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

/**
 * Páginas de una categoría: el título y las observaciones van arriba de la
 * primera imagen (no en una hoja aparte), y las siguientes van una por hoja.
 */
function CategoryPages({
  index,
  label,
  observaciones,
  images,
}: {
  index: number;
  label: string;
  observaciones: string;
  images: ExportFileData[];
}) {
  const usable = images.filter((image) => PDF_IMAGE_FORMAT[image.type]);

  const encabezado = (
    <>
      <Text style={styles.heading}>
        {index}. {label.toUpperCase()}
      </Text>
      <Text style={styles.subtitle}>Observaciones: {observaciones || "—"}</Text>
    </>
  );

  if (usable.length === 0) {
    return (
      <Page size="A4" style={styles.page}>
        {encabezado}
        <Text>(sin archivos adjuntos)</Text>
      </Page>
    );
  }

  return (
    <>
      {usable.map((image, i) => {
        const primera = i === 0;
        const { width, height } = fitToBox(image.width, image.height, primera ? 600 : MAX_HEIGHT_PT);
        return (
          <Page key={i} size="A4" style={primera ? styles.page : styles.imagePage}>
            {primera && encabezado}
            <View style={styles.imageWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is not an HTML img */}
              <Image
                style={{ width, height }}
                src={{ data: image.buffer, format: PDF_IMAGE_FORMAT[image.type] }}
              />
              <Text style={styles.imageCaption}>{image.caption}</Text>
            </View>
          </Page>
        );
      })}
    </>
  );
}

interface Props {
  data: ExportInput["data"];
  files: ExportInput["files"];
}

function LegajoPdfDocument({ data, files }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.bannerBar}>LEGAJO DE CLIENTE</Text>
        <Text style={styles.title}>LEGAJO</Text>
        <Text style={styles.subtitle}>Carpeta de documentación del cliente</Text>

        <Text style={styles.heading}>DATOS GENERALES</Text>
        <LabelValueTable
          rows={[
            ["Nombre y Apellido", data.nombreApellido],
            ["N.º de Préstamo", data.numeroPrestamo],
            ["DNI", data.dni],
            ["Fecha de Apertura del Legajo", data.fechaApertura],
          ]}
        />

        <Text style={styles.heading}>1. DATOS PERSONALES</Text>
        <LabelValueTable
          rows={[
            ["Nombre", data.nombre],
            ["Apellido", data.apellido],
            ["Teléfono", data.telefono],
            ["Email", data.email],
            ["Dirección", data.direccion],
            ["Código postal", data.codigoPostal],
            ["Referencias", data.referencias],
          ]}
        />

        <Text style={styles.heading}>2. MONTO DE PRÉSTAMO</Text>
        <LabelValueTable rows={[["Monto de Préstamo", `$ ${Number(data.montoPrestamo || 0).toFixed(2)}`]]} />

        <Text style={styles.heading}>3. SERVICIOS</Text>
        <View style={styles.row}>
          <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Servicio</Text>
          <Text style={[styles.tableHeaderCell, { width: "27%" }]}>Titular</Text>
          <Text style={[styles.tableHeaderCell, { width: "18%" }]}>Fecha</Text>
          <Text style={[styles.tableHeaderCell, { width: "35%" }]}>Observaciones</Text>
        </View>
        {data.servicios.map((row) => (
          <View style={styles.row} key={row.servicio}>
            <Text style={[styles.tableCell, { width: "20%" }]}>{row.servicio}</Text>
            <Text style={[styles.tableCell, { width: "27%" }]}>{row.titular || "—"}</Text>
            <Text style={[styles.tableCell, { width: "18%" }]}>{row.fecha || "—"}</Text>
            <Text style={[styles.tableCell, { width: "35%" }]}>{row.observaciones || "—"}</Text>
          </View>
        ))}

        <Text style={styles.heading}>4. OBSERVACIONES GENERALES</Text>
        <Text>{data.observacionesGenerales || "—"}</Text>
      </Page>

      {/* Documentación adjunta: cada categoría con su título, y cada archivo
          (o página de PDF) a página completa. */}
      {FILE_CATEGORIES.map((category, i) => (
        <CategoryPages
          key={category.key}
          index={5 + i}
          label={category.label}
          observaciones={data[category.obsKey]}
          images={files[category.key] ?? []}
        />
      ))}

      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>CHECKLIST FINAL</Text>
        <LabelValueTable
          rows={(Object.keys(CHECKLIST_LABELS) as (keyof typeof CHECKLIST_LABELS)[]).map((key) => [
            CHECKLIST_LABELS[key],
            data.checklist[key] ? "Sí" : "No",
          ])}
        />

        <Text style={styles.heading}>RESPONSABLE DEL LEGAJO</Text>
        <LabelValueTable
          rows={[
            ["Responsable", data.responsable],
            ["Fecha", data.fechaResponsable],
          ]}
        />
      </Page>
    </Document>
  );
}

export async function generatePdf(input: ExportInput): Promise<Buffer> {
  return renderToBuffer(<LegajoPdfDocument data={input.data} files={input.files} />);
}
