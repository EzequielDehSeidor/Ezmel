export type ServicioNombre =
  | "Luz"
  | "Gas"
  | "Agua"
  | "Internet"
  | "Telefonía"
  | "Otro";

export interface ServicioRow {
  servicio: ServicioNombre;
  titular: string;
  fecha: string;
  observaciones: string;
}

export interface ChecklistFinal {
  documentacionCompleta: boolean;
  dniVerificado: boolean;
  haberesVerificados: boolean;
  serviciosVerificados: boolean;
  capturasIncorporadas: boolean;
  legajoCompleto: boolean;
}

export const CHECKLIST_LABELS: Record<keyof ChecklistFinal, string> = {
  documentacionCompleta: "Documentación completa",
  dniVerificado: "DNI verificado",
  haberesVerificados: "Haberes verificados",
  serviciosVerificados: "Servicios verificados",
  capturasIncorporadas: "Capturas incorporadas",
  legajoCompleto: "Legajo completo",
};

export const SERVICIOS_DEFAULT: ServicioNombre[] = [
  "Luz",
  "Gas",
  "Agua",
  "Internet",
  "Telefonía",
  "Otro",
];

/** Campos de datos (sin archivos) del legajo — lo que completa el paso 1 del wizard. */
export interface LegajoDatos {
  // Datos Generales
  nombreApellido: string;
  numeroPrestamo: string;
  dni: string;
  fechaApertura: string;

  // 1. Datos Personales
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  direccion: string;
  codigoPostal: string;
  referencias: string;

  // Monto de Préstamo
  montoPrestamo: number;

  // 5. Servicios
  servicios: ServicioRow[];

  // 6. Observaciones Generales
  observacionesGenerales: string;

  // 7. Checklist Final
  checklist: ChecklistFinal;

  // Responsable del Legajo (quién lo armó y cuándo)
  responsable: string;
  fechaResponsable: string;
}

/** Categorías de documentación adjunta del legajo (paso 2 del wizard); cada una admite varios archivos. */
export type LegajoFileCategoryKey =
  | "dni"
  | "haberes"
  | "servicios"
  | "transferencias"
  | "capturasVarias";

export interface LegajoDatosArchivos {
  dniObs: string;
  haberesObs: string;
  serviciosObs: string;
  transferenciasObs: string;
  capturasVariasObs: string;
}

/** Extensiones aceptadas en el input de archivos (además de los MIME genéricos). */
export const ACCEPTED_FILE_ACCEPT =
  "image/*,application/pdf,.pdf,.jpg,.jpeg,.jfif,.png,.gif,.bmp,.webp,.avif,.heic,.heif,.tif,.tiff";

const IMAGE_EXTENSIONS = /\.(jpe?g|jfif|png|gif|bmp|webp|avif|heic|heif|tiff?)$/i;

export function isPdfFile(file: { name: string; type: string }): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

/**
 * Algunos archivos llegan con `type` vacío (fotos de iPhone, unidades de red),
 * así que también miramos la extensión antes de descartarlos.
 */
export function isImageFile(file: { name: string; type: string }): boolean {
  if (isPdfFile(file)) return false;
  return file.type.startsWith("image/") || IMAGE_EXTENSIONS.test(file.name);
}

export const FILE_CATEGORIES: { key: LegajoFileCategoryKey; label: string; obsKey: keyof LegajoDatosArchivos }[] = [
  { key: "dni", label: "Captura DNI frente y dorso", obsKey: "dniObs" },
  { key: "haberes", label: "Recibo de haberes", obsKey: "haberesObs" },
  { key: "servicios", label: "Servicios", obsKey: "serviciosObs" },
  {
    key: "transferencias",
    label: "Comprobante de transferencias enviadas",
    obsKey: "transferenciasObs",
  },
  { key: "capturasVarias", label: "Capturas varias", obsKey: "capturasVariasObs" },
];

/** Formulario completo del wizard (datos + metadatos de archivos; los File van aparte en el cliente). */
export type LegajoFormValues = LegajoDatos & LegajoDatosArchivos;

export type ExportFormat = "docx" | "pdf" | "xlsx";

/** Registro persistido (mock o Supabase) — sin los binarios de los archivos. */
export interface LegajoRecord extends LegajoFormValues {
  id: string;
  createdAt: string;
  createdBy: string | null;
  fileNames: Partial<Record<LegajoFileCategoryKey, string[]>>;
}
