import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { buildContratoContenido, type TextSegment } from "@/lib/contrato/buildContratoBlocks";
import type { ContratoDatos } from "@/lib/types/contrato";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Times-Roman", color: "#1e293b", lineHeight: 1.4 },
  title: { fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 12 },
  heading: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1e293b",
    marginTop: 10,
    marginBottom: 4,
  },
  body: { textAlign: "justify", marginBottom: 6 },
  firmaBlock: { marginTop: 10 },
  firmaLabel: { fontWeight: 700, color: "#17284a" },
});

function Segments({ segments }: { segments: TextSegment[] }) {
  return (
    <>
      {segments.map((s, i) => (
        <Text key={i} style={s.bold ? { fontWeight: 700 } : undefined}>
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

        <Text style={styles.heading}>FIRMAS</Text>
        {c.firmas.map((f) => (
          <View key={f.rol} style={styles.firmaBlock}>
            <Text style={styles.firmaLabel}>{f.rol}: __________</Text>
            <Text>
              Nombre completo: <Text style={{ fontWeight: 700 }}>{f.nombre}</Text>
            </Text>
            <Text>
              DNI: <Text style={{ fontWeight: 700 }}>{f.documento}</Text>
            </Text>
          </View>
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{c.pagare.titulo}</Text>
        <Text style={styles.body}>
          <Text style={{ fontWeight: 700 }}>Por: </Text>
          <Segments segments={c.pagare.por} />
        </Text>
        <Text style={styles.body}>
          <Text style={{ fontWeight: 700 }}>Vence el día: {c.pagare.vence}</Text>
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

        <View style={styles.firmaBlock}>
          <Text style={styles.firmaLabel}>{c.pagare.firmanteLabel}</Text>
          <Text>Documento N.º: {c.pagare.documento}</Text>
          <Text>Domicilio: {c.pagare.domicilio}</Text>
          <Text style={{ marginTop: 8 }}>Firma: __________</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateContratoPdf(datos: ContratoDatos): Promise<Buffer> {
  return renderToBuffer(<ContratoPdfDocument datos={datos} />);
}
