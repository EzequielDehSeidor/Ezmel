import type { LegajoFileCategoryKey, LegajoFormValues } from "@/lib/types/legajo";

/**
 * Un adjunto ya listo para incrustar: siempre una imagen (PNG/JPEG). Los PDF
 * llegan acá ya rasterizados página por página desde el cliente.
 */
export interface ExportFileData {
  /** Nombre a mostrar debajo (incluye "página X/Y" para PDF de varias páginas). */
  caption: string;
  type: string;
  width: number;
  height: number;
  buffer: Buffer;
}

export interface ExportInput {
  data: LegajoFormValues;
  files: Partial<Record<LegajoFileCategoryKey, ExportFileData[]>>;
}

/** Metadatos que el cliente manda junto a cada archivo, en el mismo orden. */
export interface AttachmentMeta {
  category: LegajoFileCategoryKey;
  caption: string;
  width: number;
  height: number;
}
