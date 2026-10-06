import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { LOGO_ASPECT, LOGO_PNG } from "@/lib/brand/logo";
import {
  buildContratoContenido,
  LINEA_DNI,
  LINEA_NOMBRE,
  type TextSegment,
} from "@/lib/contrato/buildContratoBlocks";
import type { ContratoDatos } from "@/lib/types/contrato";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b", lineHeight: 1.4 },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    color: "#ffffff",
    backgroundColor: "#1a5f6f",
    padding: 8,
    marginBottom: 12,
  },
  heading: {
    fontSize: 10,
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#1a5f6f",
    padding: 5,
    marginTop: 10,
    marginBottom: 6,
  },
  body: { textAlign: "justify", marginBottom: 6 },
  firmaBlock: { marginTop: 10 },
  firmaCampo: { marginTop: 24 },
  firmaLabel: { fontWeight: 700, color: "#1a5f6f" },
});

function Logo({ width }: { width: number }) {
  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is not an HTML img
    <Image src={{ data: LOGO_PNG, format: "png" }} style={{ width, height: width / LOGO_ASPECT }} />
  );
}

/** Logo en la esquina inferior derecha de cada hoja impresa. */
function LogoFooter() {
  return (
    <View fixed style={{ position: "absolute", bottom: 8, right: 22 }}>
      <Logo width={80} />
    </View>
  );
}

/** Datos completados: negro puro y un punto más grandes que el texto fijo. */
const datoStyle = { fontWeight: 700, fontSize: 11, color: "#000000" } as const;

function Segments({ segments }: { segments: TextSegment[] }) {
  return (
    <>
      {segments.map((s, i) => (
        <Text key={i} style={s.bold ? datoStyle : undefined}>
          {s.text}
        </Text>
      ))}
    </>
  );
}

export function ContratoPdfDocument({ datos }: { datos: ContratoDatos }) {
  const c = buildContratoContenido(datos);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{c.titulo}</Text>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Logo width={150} />
        </View>
        <Text style={styles.body}>
          <Segments segments={c.intro} />
        </Text>

        {c.clausulas.map((cl) => (
          <View key={cl.titulo}>
            <Text style={styles.heading}>{cl.titulo}</Text>
            <Text style={styles.body}>
              <Segments segments={cl.texto} />
            </Text>
          </View>
        ))}

        <View wrap={false}>
          <Text style={styles.heading}>FIRMAS</Text>
          {c.firmas.map((f) => (
            <View key={f.rol} style={[styles.firmaBlock, { marginBottom: 14 }]}>
              <Text style={styles.firmaLabel}>{f.rol}: {LINEA_DNI}</Text>
              <Text style={styles.firmaCampo}>
                Nombre completo: <Text style={datoStyle}>{f.nombre || LINEA_NOMBRE}</Text>
              </Text>
              <Text style={styles.firmaCampo}>
                DNI: <Text style={datoStyle}>{f.documento || LINEA_DNI}</Text>
              </Text>
            </View>
          ))}
        </View>
        <LogoFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{c.pagare.titulo}</Text>
        <Text style={styles.body}>
          <Text style={{ fontWeight: 700 }}>Por: </Text>
          <Segments segments={c.pagare.por} />
        </Text>
        <Text style={styles.body}>
          <Text style={{ fontWeight: 700 }}>Vence el día: </Text>
          <Text style={datoStyle}>{c.pagare.vence}</Text>
        </Text>
        <Text style={styles.body}>
          <Segments segments={c.pagare.lugar} />
        </Text>

        <Text style={styles.body}>
          <Segments segments={c.pagare.cuerpo} />
        </Text>
        <Text style={styles.body}>
          <Segments segments={c.pagare.interes} />
        </Text>
        <Text style={styles.body}>
          <Segments segments={c.pagare.ejecutivo} />
        </Text>

        <View style={{ marginTop: 20 }} wrap={false}>
          <Text style={styles.firmaLabel}>
            {c.pagare.firmanteLabel} {LINEA_NOMBRE}
          </Text>
          <Text style={styles.firmaCampo}>
            Documento N.º: <Text style={datoStyle}>{c.pagare.documento || LINEA_DNI}</Text>
          </Text>
          <Text style={styles.firmaCampo}>
            Domicilio: <Text style={datoStyle}>{c.pagare.domicilio || LINEA_NOMBRE}</Text>
          </Text>
          <Text style={styles.firmaCampo}>Firma: {LINEA_DNI}</Text>
        </View>
        <LogoFooter />
      </Page>
    </Document>
  );
}

export async function generateContratoPdf(datos: ContratoDatos): Promise<Buffer> {
  return renderToBuffer(<ContratoPdfDocument datos={datos} />);
}
