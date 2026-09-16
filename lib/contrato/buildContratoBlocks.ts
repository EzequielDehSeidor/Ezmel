import { MUTUANTE_INFO } from "@/lib/data/contratoFijo";
import { fechaPartes, formatFechaLarga } from "@/lib/format/dateEs";
import { montoEnLetras } from "@/lib/format/numberToWords";
import type { ContratoDatos } from "@/lib/types/contrato";

/** Un tramo de texto; `bold` marca los datos completados (a diferencia del texto fijo del contrato). */
export interface TextSegment {
  text: string;
  bold?: boolean;
}

export interface Clausula {
  titulo: string;
  texto: TextSegment[];
}

export interface FirmaLinea {
  rol: string;
  nombre: string;
  documento: string;
}

export interface ContratoContenido {
  titulo: string;
  intro: TextSegment[];
  clausulas: Clausula[];
  firmas: FirmaLinea[];
  pagare: {
    titulo: string;
    por: TextSegment[];
    vence: string;
    lugar: TextSegment[];
    cuerpo: TextSegment[];
    interes: TextSegment[];
    ejecutivo: TextSegment[];
    firmanteLabel: string;
    documento: string;
    domicilio: string;
  };
}

const money = (n: number) => `$ ${new Intl.NumberFormat("es-AR").format(Math.round(n || 0))}`;

const PERIODICIDAD_PLURAL: Record<ContratoDatos["periodicidadPago"], string> = {
  mensual: "mensuales",
  quincenal: "quincenales",
  semanal: "semanales",
};

/** Texto fijo del contrato. */
const t = (text: string): TextSegment => ({ text });
/** Datos completados (personales, montos, fechas) — van en negrita. */
const b = (text: string): TextSegment => ({ text, bold: true });
/** Relleno de guiones al final del renglón, como en el Word original (evita que se inserte texto en el espacio en blanco). */
const fill = (): TextSegment => t(" —" + "-".repeat(45));

/** Arma todo el texto del contrato (y del pagaré) a partir de los datos cargados. Fuente única, reusada por la vista previa, el Word y el PDF. */
export function buildContratoContenido(datos: ContratoDatos): ContratoContenido {
  const cuotasPad = String(datos.cantidadCuotas).padStart(2, "0");
  const fc = fechaPartes(datos.fechaContrato);
  const fp = fechaPartes(datos.fechaContrato);

  return {
    titulo: "CONTRATO DE MUTUO",
    intro: [
      t("Entre: "),
      b(MUTUANTE_INFO.razonSocial),
      t(", CUIT "),
      b(MUTUANTE_INFO.cuit),
      t(`, ${MUTUANTE_INFO.tipoSocietario}, con domicilio legal en la ciudad de `),
      b(MUTUANTE_INFO.domicilio),
      t(", representada en este acto por su Administrador, Sr. "),
      b(MUTUANTE_INFO.administradorNombre),
      t(", DNI "),
      b(MUTUANTE_INFO.administradorDni),
      t(', en adelante "EL MUTUANTE"; y por la otra parte '),
      b(datos.mutuarioNombre),
      t(", DNI "),
      b(datos.mutuarioDni),
      t(", con domicilio en "),
      b(datos.mutuarioDomicilio),
      t(", correo electrónico "),
      b(datos.mutuarioEmail),
      t(', en adelante "EL MUTUARIO", celebran el presente contrato de mutuo conforme a las siguientes cláusulas.'),
      fill(),
    ],
    clausulas: [
      {
        titulo: "PRIMERA – Objeto del contrato",
        texto: [
          t("El MUTUANTE entrega al MUTUARIO la suma de "),
          b(`${money(datos.montoPrestado)} (${montoEnLetras(datos.montoPrestado)})`),
          t(", en carácter de préstamo, y el MUTUARIO se obliga a devolver la suma total de "),
          b(`${money(datos.montoADevolver)} (${montoEnLetras(datos.montoADevolver)})`),
          t(", en concepto de devolución del capital más los intereses pactados, conforme al presente contrato."),
          fill(),
        ],
      },
      {
        titulo: "SEGUNDA – Forma de devolución",
        texto: [
          t("El MUTUARIO se compromete a devolver la suma total de "),
          b(money(datos.montoADevolver)),
          t(", en "),
          b(`[${cuotasPad}]`),
          t(` cuotas ${PERIODICIDAD_PLURAL[datos.periodicidadPago]} de `),
          b(money(datos.importeCuota)),
          t(" cada una, comenzando el "),
          b(formatFechaLarga(datos.fechaPrimeraCuota)),
          t(". Las cuotas deberán ser abonadas dentro de los primeros "),
          b(String(datos.diasHabilesPago)),
          t(" días hábiles del mes de vencimiento, en pesos argentinos, mediante transferencia bancaria."),
          fill(),
        ],
      },
      {
        titulo: "TERCERA – Lugar de pago",
        texto: [
          t(
            "Las cuotas deberán ser abonadas en el domicilio del MUTUANTE o mediante transferencia bancaria a la cuenta que se denuncie, según acuerdo entre las partes."
          ),
          fill(),
        ],
      },
      {
        titulo: "CUARTA – Mora",
        texto: [
          t(
            "En caso de mora en cualquiera de los pagos, el MUTUARIO deberá abonar un interés punitorio del 50% mensual " +
              "sobre el monto vencido e impago, desde la fecha de incumplimiento hasta su cancelación total. El MUTUANTE " +
              "podrá considerar vencido el total del saldo adeudado si la mora supera los 60 días. El DEUDOR pagará al " +
              "ACREEDOR además del capital pendiente y los importes de multa indicados en la cláusula tercera, un interés " +
              "moratorio equivalente al 2 % diario sobre el saldo impago desde la fecha de vencimiento hasta la fecha de " +
              "efectivo pago."
          ),
          fill(),
        ],
      },
      {
        titulo: "QUINTA",
        texto: [
          t(
            "La falta de ejercicio por parte del MUTUANTE de cualquiera de los derechos que este contrato le otorga como " +
              "acreedor y tenedor del Título Valor, así como el otorgamiento al MUTUARIO, bajo cualquier forma jurídica, de " +
              "una prórroga en los plazos pactados, no implicará la renuncia a estos derechos ni a sus garantías, ni " +
              "impedirá al MUTUANTE ejercer tales derechos u otros en lo sucesivo."
          ),
          fill(),
        ],
      },
      {
        titulo: "SEXTA – Pago anticipado",
        texto: [
          t(
            "El MUTUARIO podrá hacer el pago de la totalidad del capital adeudado antes de la fecha de vencimiento de " +
              "cada cuota, caso en el cual, cancelará en primer lugar parte de los intereses de plazo mencionados en la " +
              "cláusula CUARTA, liquidados hasta el día del pago total del capital; en caso de abonos parciales del " +
              "capital, el interés de plazo de la cláusula CUARTA se liquidará sobre el saldo de capital."
          ),
          fill(),
        ],
      },
      {
        titulo: "SÉPTIMA – Incumplimiento",
        texto: [
          t(
            "Si el MUTUARIO incurre en mora superior a 60 días, el MUTUANTE podrá declarar la deuda como vencida en su " +
              "totalidad y exigir el pago inmediato del total pactado, más los intereses punitorios correspondientes."
          ),
          fill(),
        ],
      },
      {
        titulo: "OCTAVA – Reserva de modificaciones",
        texto: [
          t(
            "Las partes expresamente convienen y hacen reserva de que las eventuales modificaciones que se acuerden a " +
              "prórroga de plazo, diferimiento de pago, modalidad y/o moneda de pago, así como cualquier pago que acepte " +
              "El MUTUANTE bajo cualquier condición, no importan novación del presente, razón por la cual conservará el " +
              "origen y antigüedad de la obligación, y la vigencia de las garantías constituidas. Toda modificación del " +
              "presente contrato deberá formalizarse por escrito y deberá constar allí las firmas de todas las partes."
          ),
          fill(),
        ],
      },
      {
        titulo: "NOVENA – Notificaciones",
        texto: [
          t(
            "Las partes declaran que los domicilios informados por cada una de ellas en el presente contrato, serán " +
              "válidos para efectuar toda notificación que se les deba hacer como consecuencia del presente convenio como " +
              "en el caso de efectuar notificaciones judiciales. Las notificaciones podrán efectuarse en los domicilios " +
              "indicados en el contrato o a los correos electrónicos declarados, con confirmación de recepción."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMA",
        texto: [
          t(
            "Las partes dejan constancia de que el MUTUARIO suscribe en este acto un pagaré a favor del MUTUANTE como " +
              "garantía del cumplimiento de las obligaciones asumidas en el presente contrato. Dicho pagaré constituye un " +
              "título ejecutivo conforme a la legislación cambiaria vigente y podrá ser ejecutado por el MUTUANTE en caso " +
              "de incumplimiento, sin perjuicio de las demás acciones derivadas del presente contrato."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO PRIMERA – Gastos",
        texto: [
          t("Todos los gastos judiciales y extrajudiciales, honorarios y costas por cobro serán a cargo exclusivo del MUTUARIO."),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO SEGUNDA – Jurisdicción",
        texto: [
          t(
            "Las partes se someten a la jurisdicción de los tribunales ordinarios con competencia en la Provincia de " +
              "Buenos Aires, renunciando a cualquier otro fuero que pudiera corresponder."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO TERCERA – Domicilios",
        texto: [
          t(
            "Las partes constituyen como domicilios legales los indicados al inicio del contrato, donde serán válidas " +
              "todas las notificaciones judiciales o extrajudiciales. A prueba de conformidad, se firma este ejemplar de " +
              "un mismo tenor y a un mismo efecto, en la provincia de Buenos Aires, a los "
          ),
          b(`${fc.dia} días del mes de ${fc.mes} de ${fc.anio}`),
          t("."),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO CUARTA – Firma electrónica y digital",
        texto: [
          t(
            "Las partes acuerdan expresamente que el presente contrato podrá ser suscripto mediante firma electrónica " +
              "y/o firma digital, a través de cualquier plataforma o mecanismo que permita identificar razonablemente al " +
              "firmante y dejar constancia de su manifestación de voluntad. Las partes reconocen plena validez, eficacia " +
              "y fuerza probatoria a dichas firmas, comprometiéndose a no desconocer su autenticidad, integridad, autoría " +
              "ni los efectos jurídicos derivados de este instrumento por el solo hecho de haber sido suscripto por medios " +
              "electrónicos, salvo prueba fehaciente en contrario. Asimismo, reconocen que los registros electrónicos, " +
              "constancias de envío, aceptación, autenticación, direcciones IP, correos electrónicos, códigos de " +
              "verificación y demás elementos técnicos generados durante el proceso de firma podrán ser utilizados como " +
              "medio de prueba suficiente respecto de la celebración y contenido del presente contrato."
          ),
        ],
      },
    ],
    firmas: [
      {
        rol: "Firma del MUTUANTE (Administrador)",
        nombre: MUTUANTE_INFO.administradorNombre,
        documento: MUTUANTE_INFO.administradorDni,
      },
      { rol: "Firma del MUTUARIO", nombre: datos.mutuarioNombre, documento: datos.mutuarioDni },
      {
        rol: "Firma del GARANTE (si hubiere)",
        nombre: datos.garanteNombre,
        documento: datos.garanteDni,
      },
    ],
    pagare: {
      titulo: "PAGARÉ",
      por: [b(`${montoEnLetras(datos.montoADevolver)} – (${money(datos.montoADevolver)})`)],
      vence: formatFechaLarga(datos.fechaVencimientoPagare),
      lugar: [t("En la localidad de "), b(MUTUANTE_INFO.domicilio), t(".")],
      cuerpo: [
        t("El día "),
        b(`${fp.dia} del mes de ${fp.mes} del año ${fp.anio}`),
        t(" PAGARÉ sin protesto (art. 50 dec./ley 5.965/63) al Sr. "),
        b(MUTUANTE_INFO.razonSocial),
        t(", CUIT "),
        b(MUTUANTE_INFO.cuit),
        t(" o a su orden, la suma de "),
        b(`${montoEnLetras(datos.montoADevolver)} – (${money(datos.montoADevolver)})`),
        t(", por igual valor recibido en efectivo a mi entera satisfacción, pagadero en "),
        b(MUTUANTE_INFO.domicilio),
        t(", en el domicilio del beneficiario o mediante transferencia bancaria a la cuenta que este indique."),
      ],
      interes: [
        t(
          "El presente documento devengará, a partir de la fecha de mora, un interés punitorio de Cincuenta por ciento " +
            "(50 %) mensual sobre el saldo impago."
        ),
      ],
      ejecutivo: [
        t(
          "Las partes acuerdan que el presente contrato constituye un título ejecutivo conforme a lo establecido en la " +
            "legislación vigente, en virtud de las obligaciones claras, expresas y exigibles que en él se consignan. En " +
            "caso de incumplimiento de cualquiera de las obligaciones aquí pactadas, la parte cumplidora podrá acudir " +
            "directamente a la vía ejecutiva para exigir el cumplimiento forzoso de las mismas, sin necesidad de " +
            "requerimientos o reconocimientos adicionales, salvo aquellos exigidos por la normativa aplicable."
        ),
      ],
      firmanteLabel: "Firmante:",
      documento: "",
      domicilio: "",
    },
  };
}
