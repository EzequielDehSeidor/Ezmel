import { Document, Page, View, Text, renderToBuffer } from "@react-pdf/renderer";
import { buildRefinanciacionContenido } from "@/lib/refinanciacion/contenido";
import type { RefinanciacionDatos } from "@/lib/types/refinanciacion";
import { LogoFooter, LogoTagline, datoStyle, styles } from "./toContratoPdf";

/** Mismo formato que el contrato y el legajo: barra de título, logo con subtítulo, datos en negrita y pie con logo. */
function RefinanciacionPdfDocument({ datos }: { datos: RefinanciacionDatos }) {
  const c = buildRefinanciacionContenido(datos);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{c.titulo}</Text>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <LogoTagline width={150} />
        </View>
        {c.campos.map((campo) => (
          <Text key={campo.label} style={{ marginTop: 16 }}>
            {campo.label}: <Text style={datoStyle}>{campo.valor}</Text>
          </Text>
        ))}
        <LogoFooter />
      </Page>
    </Document>
  );
}

export async function generateRefinanciacionPdf(datos: RefinanciacionDatos): Promise<Buffer> {
  return renderToBuffer(<RefinanciacionPdfDocument datos={datos} />);
}
