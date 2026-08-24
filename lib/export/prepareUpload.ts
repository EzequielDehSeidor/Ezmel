"use client";

import { FILE_CATEGORIES, isImageFile, isPdfFile } from "@/lib/types/legajo";
import type { LegajoFileCategoryKey } from "@/lib/types/legajo";
import { pdfToPngPages } from "@/lib/pdf/pdfToPngPages";
import type { AttachmentMeta } from "./common";

// Netlify Functions corta el request en 6MB (límite fijo de la plataforma,
// no configurable). Recomprimimos todo bien por debajo de eso.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Reencoda cualquier imagen a JPEG, achicada si hace falta. Las fotos de
 * celular pueden pesar varios MB aun siendo JPEG; sin esto, dos o tres fotos
 * ya alcanzan el límite de la función.
 */
async function toEmbeddableImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`No se pudo leer la imagen ${file.name}`));
      el.src = url;
    });

    const scale = Math.min(MAX_DIMENSION / img.naturalWidth, MAX_DIMENSION / img.naturalHeight, 1);
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    // Fondo blanco: PNG con transparencia se vería negro al pasar a JPEG.
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) throw new Error(`No se pudo convertir ${file.name}`);

    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface PreparedUpload {
  meta: AttachmentMeta[];
  /** Archivos en el mismo orden que `meta`, ya listos para el FormData. */
  blobs: { category: LegajoFileCategoryKey; blob: Blob; filename: string }[];
  totalBytes: number;
}

/**
 * Deja todos los adjuntos como imágenes JPEG livianas antes de mandarlos al
 * servidor: las imágenes se recomprimen, y cada PDF se expande a una imagen
 * por página. Así el servidor no necesita rasterizar nada.
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
            filename: `${file.name}-p${page.pageNumber}.jpg`,
          });
        }
      } else if (isImageFile(file)) {
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

  const totalBytes = blobs.reduce((sum, b) => sum + b.blob.size, 0);
  return { meta, blobs, totalBytes };
}
