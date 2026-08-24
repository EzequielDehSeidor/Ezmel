"use client";

import { FILE_CATEGORIES, isImageFile, isPdfFile } from "@/lib/types/legajo";
import type { LegajoFileCategoryKey } from "@/lib/types/legajo";
import { imageDimensions, pdfToPngPages } from "@/lib/pdf/pdfToPngPages";
import type { AttachmentMeta } from "./common";

const PASAN_DIRECTO = ["image/png", "image/jpeg", "image/jpg"];

/** Deja la imagen en un formato que Word y PDF puedan incrustar (PNG o JPEG). */
async function toEmbeddableImage(
  file: File
): Promise<{ blob: Blob; width: number; height: number }> {
  if (PASAN_DIRECTO.includes(file.type)) {
    const { width, height } = await imageDimensions(file);
    return { blob: file, width, height };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`No se pudo leer la imagen ${file.name}`));
      el.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")?.drawImage(img, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error(`No se pudo convertir ${file.name}`);

    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface PreparedUpload {
  meta: AttachmentMeta[];
  /** Archivos en el mismo orden que `meta`, ya listos para el FormData. */
  blobs: { category: LegajoFileCategoryKey; blob: Blob; filename: string }[];
}

/**
 * Deja todos los adjuntos como imágenes antes de mandarlos al servidor:
 * las imágenes van tal cual, y cada PDF se expande a una imagen por página.
 * Así el servidor no necesita rasterizar nada.
 */
export async function prepareUpload(
  files: Partial<Record<LegajoFileCategoryKey, File[]>>
): Promise<PreparedUpload> {
  const meta: AttachmentMeta[] = [];
  const blobs: PreparedUpload["blobs"] = [];

  for (const category of FILE_CATEGORIES) {
    for (const file of files[category.key] ?? []) {
      if (isPdfFile(file)) {
        const pages = await pdfToPngPages(file);
        for (const page of pages) {
          meta.push({
            category: category.key,
            caption:
              page.totalPages > 1
                ? `${file.name} — página ${page.pageNumber}/${page.totalPages}`
                : file.name,
            width: page.width,
            height: page.height,
          });
          blobs.push({
            category: category.key,
            blob: page.blob,
            filename: `${file.name}-p${page.pageNumber}.png`,
          });
        }
      } else if (isImageFile(file)) {
        // Word y PDF sólo saben incrustar PNG/JPEG. El resto (webp, avif,
        // heic, o archivos sin `type`) se reencodan a PNG acá.
        const normalizado = await toEmbeddableImage(file);
        meta.push({
          category: category.key,
          caption: file.name,
          width: normalizado.width,
          height: normalizado.height,
        });
        blobs.push({ category: category.key, blob: normalizado.blob, filename: file.name });
      }
    }
  }

  return { meta, blobs };
}
