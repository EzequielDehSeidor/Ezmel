import { MUTUANTE_INFO } from "@/lib/data/contratoFijo";
import { fechaPartes, formatFechaCorta, formatFechaLarga } from "@/lib/format/dateEs";
import { montoEnLetras, numeroALetras } from "@/lib/format/numberToWords";
import { formatDni, formatDomicilio } from "@/lib/format/personal";
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
  numero: TextSegment[];
  intro: TextSegment[];
  clausulas: Clausula[];
  cierre: TextSegment[];
  firmas: FirmaLinea[];
  pagare: {
    titulo: string;
    subtitulo: string;
    encabezado: TextSegment[];
    por: TextSegment[];
    cuerpo: TextSegment[];
    valor: TextSegment[];
    lugarFecha: TextSegment[];
    firmanteLabel: string;
    nombre: string;
    documento: string;
    domicilio: string;
  };
}

/** Condiciones que no varían de un préstamo a otro. */
const IVA_INTERESES = 0.21;
const PUNITORIO_MENSUAL = 45;

const numberFormat = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const numberFormatEntero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/** "$ 200.000" si es entero, "$ 144.000,50" si tiene centavos. */
const money = (n: number) => {
  const centavos = Math.round((n || 0) * 100);
  return `$ ${(centavos % 100 === 0 ? numberFormatEntero : numberFormat).format(centavos / 100)}`;
};

/** "437,19 %" */
const pct = (n: number) => `${numberFormat.format(n)} %`;

const redondear2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Desglose del total a devolver: lo que excede el capital son intereses compensatorios más el IVA sobre
 * esos intereses, así que ambos salen de la suma total y del capital sin cargarlos a mano.
 */
export function desglosarIntereses(montoPrestado: number, montoADevolver: number) {
  const recargo = redondear2((montoADevolver || 0) - (montoPrestado || 0));
  const intereses = redondear2(recargo / (1 + IVA_INTERESES));
  return { intereses, iva: redondear2(recargo - intereses) };
}

const PERIODICIDAD: Record<ContratoDatos["periodicidadPago"], { plural: string; singular: string }> = {
  mensual: { plural: "mensuales", singular: "mensual" },
  quincenal: { plural: "quincenales", singular: "quincenal" },
  semanal: { plural: "semanales", singular: "semanal" },
};

/** Líneas para completar a mano en las firmas (Nombre completo / DNI), igual que la línea de la firma. */
export const LINEA_NOMBRE = "_".repeat(32);
export const LINEA_DNI = "_".repeat(20);

/** Texto fijo del contrato. */
const t = (text: string): TextSegment => ({ text });
/** Datos completados (personales, montos, fechas) — van en negrita. */
const b = (text: string): TextSegment => ({ text, bold: true });
/** Relleno de guiones al final del renglón, como en el Word original (evita que se inserte texto en el espacio en blanco). */
const fill = (): TextSegment => t(" —" + "-".repeat(45));

/** "14 días del mes de octubre de 2026" */
function diasDelMes(iso: string): string {
  const f = fechaPartes(iso);
  return `${f.dia} días del mes de ${f.mes.toLowerCase()} de ${f.anio}`;
}

/** Arma todo el texto del contrato (y del pagaré) a partir de los datos cargados. Fuente única, reusada por la vista previa, el Word y el PDF. */
export function buildContratoContenido(datos: ContratoDatos): ContratoContenido {
  const numero = datos.numeroContrato.padStart(6, "0");
  const dni = formatDni(datos.mutuarioDni);
  const domicilio = formatDomicilio(datos.mutuarioDomicilio);
  const { intereses, iva } = desglosarIntereses(datos.montoPrestado, datos.montoADevolver);
  const periodicidad = PERIODICIDAD[datos.periodicidadPago];
  const cuotas = datos.cantidadCuotas;
  const tasaDiaria = `${(PUNITORIO_MENSUAL / 30).toFixed(4).replace(".", ",")}%`;
  const prestadoLetras = `${money(datos.montoPrestado)} (${montoEnLetras(datos.montoPrestado)})`;
  const totalLetras = `${money(datos.montoADevolver)} (${montoEnLetras(datos.montoADevolver)})`;
  const cbuAlias = [datos.mutuarioCbu, datos.mutuarioAlias].filter(Boolean).join(" / ");
  const contacto = [b(MUTUANTE_INFO.email), t(" o teléfono "), b(MUTUANTE_INFO.telefono)];

  return {
    titulo: "CONTRATO DE MUTUO",
    numero: [t("Contrato N° "), b(numero)],
    intro: [
      t("Entre: "),
      b(MUTUANTE_INFO.razonSocial),
      t(" (nombre comercial: "),
      b(MUTUANTE_INFO.nombreComercial),
      t("), CUIT "),
      b(MUTUANTE_INFO.cuit),
      t(`, ${MUTUANTE_INFO.tipoSocietario}, con domicilio legal en la ciudad de `),
      b(MUTUANTE_INFO.domicilio),
      t(", representada en este acto por su Administrador, Sr. "),
      b(MUTUANTE_INFO.administradorNombre),
      t(", DNI "),
      b(MUTUANTE_INFO.administradorDni),
      t(', en adelante "EL MUTUANTE"; y por la otra parte, el/la Sr./Sra. '),
      b(datos.mutuarioNombre.toUpperCase()),
      t(", DNI N° "),
      b(dni),
      t(", con domicilio real en "),
      b(domicilio),
      t(", y correo electrónico "),
      b(datos.mutuarioEmail),
      t(
        ', en adelante "EL MUTUARIO"; celebran el presente contrato de mutuo, el cual se regirá por el Código Civil y ' +
          "Comercial de la Nación, la Ley 24.240 de Defensa del Consumidor y las siguientes cláusulas:"
      ),
      fill(),
    ],
    clausulas: [
      {
        titulo: "PRIMERA – Objeto y desembolso",
        texto: [
          t("EL MUTUANTE otorga a EL MUTUARIO, en calidad de mutuo oneroso, la suma de "),
          b(prestadoLetras),
          t(
            ", que será acreditada mediante transferencia bancaria a la cuenta de titularidad de EL MUTUARIO " +
              "identificada con CBU/Alias "
          ),
          b(cbuAlias),
          t(
            ", sirviendo el comprobante de transferencia como suficiente recibo. EL MUTUARIO se obliga a devolver " +
              "la suma total de "
          ),
          b(totalLetras),
          t(
            ", monto que comprende el capital mutuado, los intereses compensatorios pactados y el IVA sobre dichos " +
              "intereses, conforme al plan de pagos establecido en la cláusula siguiente."
          ),
          fill(),
        ],
      },
      {
        titulo: "SEGUNDA – Plan de pagos",
        texto: [
          t("El préstamo se devolverá en "),
          b(`${cuotas} (${numeroALetras(cuotas).toUpperCase()})`),
          t(cuotas === 1 ? " cuota " : " cuotas "),
          b(cuotas === 1 ? periodicidad.singular : periodicidad.plural),
          t(" de "),
          b(`${money(datos.importeCuota)} (${montoEnLetras(datos.importeCuota)})`),
          t(" cada una. La primera cuota vencerá el día "),
          b(formatFechaLarga(datos.fechaPrimeraCuota)),
          t(
            ". Si el vencimiento cayera en día inhábil, se trasladará al primer día hábil siguiente sin recargo. " +
              "Las fechas de vencimiento de cada cuota constan en el ANEXO I. Los pagos se efectuarán en pesos " +
              "argentinos mediante transferencia bancaria a la cuenta Alias "
          ),
          b(MUTUANTE_INFO.aliasPago),
          t(
            ", de titularidad de EL MUTUANTE, considerándose realizado el pago en la fecha de acreditación de los fondos."
          ),
          fill(),
        ],
      },
      {
        titulo: "TERCERA – Tasa de interés, costo financiero total e información al consumidor",
        texto: [
          t(
            "El préstamo devenga un interés compensatorio a tasa fija, calculado sobre el saldo de capital adeudado, " +
              "a una Tasa Nominal Anual (TNA) del "
          ),
          b(pct(datos.tna)),
          t(", equivalente a una Tasa Efectiva Mensual (TEM) del "),
          b(pct(datos.tem)),
          t(" y a una Tasa Efectiva Anual (TEA) del "),
          b(pct(datos.tea)),
          t(
            ". El préstamo se amortiza por el sistema francés, con cuota total fija que incluye el IVA sobre " +
              "intereses (21%). En cumplimiento del artículo 36 de la Ley 24.240 se informa: importe neto a desembolsar "
          ),
          b(money(datos.montoPrestado)),
          t("; total de intereses compensatorios "),
          b(money(intereses)),
          t("; IVA sobre intereses "),
          b(money(iva)),
          t("; total a pagar "),
          b(money(datos.montoADevolver)),
          t("; "),
          b(String(cuotas)),
          t(cuotas === 1 ? " cuota de " : " cuotas de "),
          b(money(datos.importeCuota)),
          t(". No existen otros cargos, comisiones ni gastos distintos de los aquí informados."),
          fill(),
          t("\nCOSTO FINANCIERO TOTAL EFECTIVO ANUAL (CFTEA) CON IVA:\n"),
          b(pct(datos.cftea)),
          t(
            "\nEl detalle de cada cuota, con su fecha de vencimiento, capital, interés, IVA y saldo, consta en el " +
              "ANEXO I, que forma parte integrante del presente contrato."
          ),
          fill(),
        ],
      },
      {
        titulo: "CUARTA – Mora e intereses punitorios",
        texto: [
          t(
            "La mora se producirá de pleno derecho por el solo vencimiento de los plazos pactados, sin necesidad de " +
              "interpelación previa. En caso de mora, además del interés compensatorio pactado, la porción de capital " +
              `de cada cuota vencida e impaga devengará un interés punitorio del ${PUNITORIO_MENSUAL}% mensual ` +
              `(tasa diaria equivalente del ${tasaDiaria}), desde la fecha de mora hasta su efectivo pago. Los ` +
              "intereses punitorios se calcularán exclusivamente sobre capital, no se capitalizarán ni devengarán a su " +
              "vez intereses."
          ),
          fill(),
        ],
      },
      {
        titulo: "QUINTA – Caducidad de plazos",
        texto: [
          t(
            "Ante la falta de pago de dos (2) cuotas, consecutivas o alternadas, o si se verificara la falsedad de " +
              "los datos o declaraciones juradas brindados por EL MUTUARIO, EL MUTUANTE podrá, previa intimación " +
              "fehaciente al pago por un plazo de cinco (5) días corridos, declarar la caducidad de los plazos y " +
              "exigir el pago total de lo adeudado. En tal caso, la suma exigible se limitará al saldo de capital " +
              "pendiente de amortización, con más los intereses compensatorios devengados hasta la fecha de la mora, " +
              "los intereses punitorios pactados y el IVA correspondiente. En ningún caso podrán reclamarse " +
              "intereses compensatorios no devengados."
          ),
          fill(),
        ],
      },
      {
        titulo: "SEXTA – Pagaré vinculado",
        texto: [
          t(
            "Como instrumento vinculado a la presente obligación, EL MUTUARIO suscribe un pagaré sin protesto " +
              "(Decreto-Ley 5965/63), N° "
          ),
          b(numero),
          t(", por "),
          b(totalLetras),
          t(
            ", a la orden de EL MUTUANTE, que hace expresa referencia a este contrato. Las partes reconocen que el " +
              "pagaré instrumenta la misma obligación causal aquí pactada, por lo que EL MUTUARIO nunca estará " +
              "obligado a pagar una suma mayor a la que resulte adeudada conforme a este contrato y su ANEXO I, " +
              "deducidos los pagos efectuados y excluidos los intereses no devengados. EL MUTUANTE podrá reclamar el " +
              "cobro con base en el pagaré o en el presente contrato, siendo ambas vías alternativas y no " +
              "acumulables, sin que en ningún caso pueda duplicarse el cobro de la misma deuda. Cancelada la " +
              "totalidad de la deuda, o revocado el contrato en los términos de la cláusula octava, EL MUTUANTE " +
              "restituirá el pagaré a EL MUTUARIO."
          ),
          fill(),
        ],
      },
      {
        titulo: "SÉPTIMA – Pago anticipado",
        texto: [
          t(
            "EL MUTUARIO podrá realizar pagos anticipados parciales o cancelar anticipadamente la totalidad del " +
              "saldo en cualquier momento, abonando el capital pendiente de amortización y los intereses " +
              "compensatorios devengados hasta el día del pago, con su IVA, sin comisión ni penalidad alguna. Los " +
              "pagos parciales anticipados se imputarán a capital, reduciendo el importe de las cuotas o su cantidad, " +
              "a elección de EL MUTUARIO."
          ),
          fill(),
        ],
      },
      {
        titulo: "OCTAVA – Derecho de revocación",
        texto: [
          t(
            "De conformidad con los artículos 1110 y siguientes del Código Civil y Comercial de la Nación y el " +
              "artículo 34 de la Ley 24.240, EL MUTUARIO podrá revocar la aceptación del presente préstamo dentro de " +
              "los diez (10) días corridos contados desde la fecha de celebración o desde la acreditación de los " +
              "fondos, lo que ocurra último, sin necesidad de expresar causa, notificando a EL MUTUANTE por el mismo " +
              "medio por el que contrató o a través del correo electrónico "
          ),
          ...contacto,
          t(
            ". Notificada la revocación, EL MUTUARIO deberá restituir el capital recibido dentro de los cinco (5) " +
              "días hábiles siguientes. La revocación no tendrá costo ni penalidad para EL MUTUARIO; si hubiera " +
              "utilizado los fondos, sólo abonará el interés compensatorio pactado por los días transcurridos hasta " +
              "la restitución. Si hubiera pagado alguna comisión de otorgamiento, le será reintegrada."
          ),
          fill(),
        ],
      },
      {
        titulo: "NOVENA – Impuestos y gastos",
        texto: [
          t(
            "El impuesto de sellos que corresponda, en la proporción que la ley ponga a cargo de EL MUTUARIO, y el " +
              "IVA sobre intereses informado en la cláusula tercera serán a cargo de EL MUTUARIO. EL MUTUANTE no " +
              "cobrará cargos, comisiones ni gastos que no estén expresamente informados en este contrato. Las " +
              "costas de un eventual proceso judicial serán soportadas conforme lo resuelva el tribunal interviniente."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMA – Protección de datos personales",
        texto: [
          t(
            "EL MUTUARIO presta su consentimiento libre, expreso e informado para que EL MUTUANTE trate sus datos " +
              "personales con la finalidad de evaluar, otorgar, administrar y cobrar el presente préstamo, y para " +
              "que, en caso de incumplimiento, informe su situación a bases de datos de información crediticia en " +
              "los términos del artículo 26 de la Ley 25.326. EL MUTUARIO podrá ejercer sus derechos de acceso, " +
              "rectificación, actualización y supresión dirigiéndose a EL MUTUANTE por los medios indicados en la " +
              "cláusula décimo segunda. El titular de los datos personales tiene la facultad de ejercer el derecho de " +
              "acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite " +
              "un interés legítimo al efecto, conforme lo establecido en el artículo 14, inciso 3 de la Ley N° " +
              "25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley " +
              "N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten " +
              "afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos " +
              "personales."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO PRIMERA – Declaraciones juradas del mutuario",
        texto: [
          t(
            "EL MUTUARIO declara bajo juramento que: a) los datos personales, laborales y de ingresos informados son " +
              "veraces y completos; b) los fondos recibidos no serán destinados a actividades ilícitas; c) NO " +
              "reviste la condición de Persona Expuesta Políticamente conforme la normativa de la Unidad de " +
              "Información Financiera; y d) se obliga a informar a EL MUTUANTE cualquier cambio de domicilio, correo " +
              "electrónico o datos de contacto dentro de los cinco (5) días de producido."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO SEGUNDA – Atención al cliente y reclamos",
        texto: [
          t("Las consultas y reclamos podrán dirigirse a EL MUTUANTE a través del correo electrónico "),
          ...contacto,
          t(
            ", quien deberá responderlos dentro de los diez (10) días hábiles. Sin perjuicio de ello, EL MUTUARIO " +
              "podrá efectuar sus reclamos ante la autoridad de aplicación de la Ley 24.240 correspondiente a su " +
              "domicilio."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO TERCERA – No renuncia de derechos",
        texto: [
          t(
            "La falta de ejercicio por parte de EL MUTUANTE de cualquiera de los derechos que este contrato le " +
              "otorga como acreedor y tenedor del pagaré vinculado, así como el otorgamiento a EL MUTUARIO, bajo " +
              "cualquier forma jurídica, de una prórroga en los plazos pactados, no implicará la renuncia a estos " +
              "derechos ni a sus garantías, ni impedirá a EL MUTUANTE ejercer tales derechos u otros en lo sucesivo."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO CUARTA – Reserva de modificaciones",
        texto: [
          t(
            "Las partes expresamente convienen y hacen reserva de que las eventuales modificaciones que se acuerden " +
              "en cuanto a prórroga de plazo, diferimiento de pago, modalidad y/o moneda de pago, así como cualquier " +
              "pago que acepte EL MUTUANTE bajo cualquier condición, no importan novación del presente, razón por la " +
              "cual conservará el origen y antigüedad de la obligación y la vigencia de las garantías constituidas. " +
              "Toda modificación del presente contrato deberá formalizarse por escrito y deberá constar allí la " +
              "firma de todas las partes."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO QUINTA – Domicilios y comunicaciones",
        texto: [
          t(
            "Las partes constituyen domicilio en los consignados en el encabezamiento, y domicilio electrónico en " +
              "los correos electrónicos allí denunciados, donde serán válidas las comunicaciones extrajudiciales " +
              "vinculadas a este contrato. Cualquier cambio deberá ser notificado a la otra parte. Las " +
              "notificaciones judiciales se regirán por la ley procesal aplicable."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO SEXTA – Jurisdicción y competencia",
        texto: [
          t(
            "De conformidad con el artículo 36 de la Ley 24.240, para toda cuestión derivada del presente contrato " +
              "y del pagaré vinculado será competente el tribunal ordinario correspondiente al domicilio real de EL " +
              "MUTUARIO, consignado en el encabezamiento ("
          ),
          b(domicilio),
          t(")."),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO SÉPTIMA – Firma electrónica y digital",
        texto: [
          t(
            "El presente contrato, su ANEXO I y el pagaré vinculado podrán suscribirse con firma ológrafa, digital " +
              "o electrónica, de conformidad con la Ley 25.506, a través de cualquier plataforma o mecanismo que " +
              "permita identificar razonablemente al firmante y dejar constancia de su manifestación de voluntad. " +
              "Las partes reconocen plena validez, eficacia y fuerza probatoria a dichas firmas. Cuando se utilice " +
              "firma electrónica, las partes acuerdan que los registros de la plataforma (identificación del " +
              "firmante, fecha, hora, dirección IP, correos electrónicos, códigos de verificación y demás " +
              "constancias de envío, aceptación y autenticación) constituirán medio de prueba de la autoría e " +
              "integridad de los documentos suscriptos, y EL MUTUARIO reconoce expresamente como propia la firma " +
              "electrónica que estampe en ellos."
          ),
          fill(),
        ],
      },
      {
        titulo: "DÉCIMO OCTAVA – Entrega de ejemplares",
        texto: [
          t(
            "EL MUTUARIO declara haber recibido, en forma previa a la firma, toda la información sobre las " +
              "condiciones del préstamo, y un ejemplar del presente contrato, de su ANEXO I y copia del pagaré " +
              "vinculado."
          ),
          fill(),
        ],
      },
    ],
    cierre: [
      t(
        "En prueba de conformidad, se firman dos ejemplares de un mismo tenor y a un solo efecto, en la ciudad de "
      ),
      b(MUTUANTE_INFO.domicilio),
      t(", a los "),
      b(diasDelMes(datos.fechaContrato)),
      t("."),
      fill(),
    ],
    firmas: [
      {
        rol: "Firma del MUTUANTE (Administrador)",
        nombre: MUTUANTE_INFO.administradorNombre,
        documento: MUTUANTE_INFO.administradorDni,
      },
      { rol: "Firma del MUTUARIO", nombre: "", documento: "" },
      {
        rol: "Firma del GARANTE (si hubiere)",
        nombre: datos.garanteNombre,
        documento: datos.garanteDni,
      },
    ],
    pagare: {
      titulo: "PAGARÉ SIN PROTESTO",
      subtitulo: "Decreto-Ley 5965/63",
      encabezado: [t("Nro: "), b(numero), t("      Vencimiento: "), b(formatFechaCorta(datos.fechaVencimientoPagare))],
      por: [t("Por Pesos: "), b(money(datos.montoADevolver)), t(" (En letras: "), b(montoEnLetras(datos.montoADevolver)), t(")")],
      cuerpo: [
        t("Pagaré/mos sin protesto (art. 50 Decreto-Ley 5965/63) a la orden de "),
        b(MUTUANTE_INFO.razonSocial),
        t(", CUIT "),
        b(MUTUANTE_INFO.cuit),
        t(", la suma libre de gastos de "),
        b(montoEnLetras(datos.montoADevolver)),
        t(" el día "),
        b(formatFechaLarga(datos.fechaVencimientoPagare)),
        t(", pagadero en el domicilio del beneficiario en "),
        b(MUTUANTE_INFO.domicilio),
        t(" (o mediante transferencia a la cuenta bancaria denunciada en el contrato)."),
      ],
      valor: [
        t("Valor recibido en mutuo, conforme Contrato de Mutuo N° "),
        b(numero),
        t(" de fecha "),
        b(formatFechaCorta(datos.fechaContrato)),
        t(
          ", que el librador declara conocer y del cual ha recibido un ejemplar. Los intereses por mora se rigen por " +
            "lo pactado en el contrato de mutuo al que este pagaré se vincula."
        ),
      ],
      lugarFecha: [
        t("Lugar y fecha de libramiento: "),
        b(MUTUANTE_INFO.domicilio),
        t(", a los "),
        b(diasDelMes(datos.fechaContrato)),
        t("."),
      ],
      firmanteLabel: "Firma del Librador (Mutuario):",
      nombre: "",
      documento: "",
      domicilio: "",
    },
  };
}
