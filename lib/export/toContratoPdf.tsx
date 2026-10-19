import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { LOGO_ASPECT, LOGO_PNG, LOGO_TAGLINE_ASPECT, LOGO_TAGLINE_PNG } from "@/lib/brand/logo";
import {
  buildContratoContenido,
  LINEA_DNI,
  LINEA_NOMBRE,
  type TextSegment,
} from "@/lib/contrato/buildContratoBlocks";
import type { ContratoDatos } from "@/lib/types/contrato";

export const styles = StyleSheet.create({
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
  firmaCampo: { marginTop: 22 },
  firmaLabel: { fontWeight: 700, color: "#1a5f6f" },
});

function Logo({ width }: { width: number }) {
  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is not an HTML img
    <Image src={{ data: LOGO_PNG, format: "png" }} style={{ width, height: width / LOGO_ASPECT }} />
  );
}

/** Logo con el subtítulo "Servicios financieros" debajo, para el encabezado. */
export function LogoTagline({ width }: { width: number }) {
  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is not an HTML img
    <Image src={{ data: LOGO_TAGLINE_PNG, format: "png" }} style={{ width, height: width / LOGO_TAGLINE_ASPECT }} />
  );
}

/** Logo chico y subtítulo en la esquina inferior derecha de cada hoja impresa. */
export function LogoFooter() {
  return (
    <View fixed style={{ position: "absolute", bottom: 8, right: 22, alignItems: "flex-end" }}>
      <Logo width={80} />
      <Text style={{ marginTop: 2, fontSize: 5.5, letterSpacing: 1.2, color: "#1b4558" }}>SERVICIOS FINANCIEROS</Text>
    </View>
  );
}

/** Datos completados: negro puro y un punto más grandes que el texto fijo. */
export const datoStyle = { fontWeight: 700, fontSize: 11, color: "#000000" } as const;

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
          <LogoTagline width={150} />
        </View>
        <Text style={styles.body}>
          <Segments segments={c.numero} />
        </Text>
        <Text style={styles.body}>
          <Segments segments={c.intro} />
        </Text>

        {c.clausulas.map((cl) => (
          <View key={cl.titulo} wrap={false}>
            <Text style={styles.heading}>{cl.titulo}</Text>
            <Text style={styles.body}>
              <Segments segments={cl.texto} />
            </Text>
          </View>
        ))}

        <Text style={[styles.body, { marginTop: 8 }]}>
          <Segments segments={c.cierre} />
        </Text>

        <View wrap={false}>
          <Text style={styles.heading}>FIRMAS</Text>
          {c.firmas.map((f, i) => (
            <View key={f.rol} style={[styles.firmaBlock, { marginTop: i === 0 ? 28 : 10, marginBottom: 24 }]}>
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
        <Text style={[styles.body, { textAlign: "center" }]}>{c.pagare.subtitulo}</Text>
        <Text style={styles.body}>
          <Segments segments={c.pagare.encabezado} />
        </Text>
        <Text style={styles.body}>
          <Segments segments={c.pagare.por} />
        </Text>

        <Text style={styles.body}>
          <Segments segments={c.pagare.cuerpo} />
        </Text>
        <Text style={styles.body}>
          <Segments segments={c.pagare.valor} />
        </Text>
        <Text style={styles.body}>
          <Segments segments={c.pagare.lugarFecha} />
        </Text>

        <View style={{ marginTop: 20 }} wrap={false}>
          <Text style={styles.firmaLabel}>
            {c.pagare.firmanteLabel} {LINEA_NOMBRE}
          </Text>
          <Text style={styles.firmaCampo}>
            Nombre y apellido: <Text style={datoStyle}>{c.pagare.nombre || LINEA_NOMBRE}</Text>
          </Text>
          <Text style={styles.firmaCampo}>
            DNI N°: <Text style={datoStyle}>{c.pagare.documento || LINEA_DNI}</Text>
          </Text>
          <Text style={styles.firmaCampo}>
            Domicilio: <Text style={datoStyle}>{c.pagare.domicilio || LINEA_NOMBRE}</Text>
          </Text>
        </View>
        <LogoFooter />
      </Page>
    </Document>
  );
}

export async function generateContratoPdf(datos: ContratoDatos): Promise<Buffer> {
  return renderToBuffer(<ContratoPdfDocument datos={datos} />);
}
