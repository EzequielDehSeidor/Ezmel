"use client";

export interface PngPage {
  blob: Blob;
  width: number;
  height: number;
  pageNumber: number;
  totalPages: number;
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

function loadPdfjs() {
  pdfjsPromise ??= import("pdfjs-dist").then((mod) => {
    // El worker se crea acá a mano y con `type: "module"`. Si en cambio se usa
    // `workerSrc`, pdfjs lo instancia como script clásico, el archivo ESM no
    // carga, y cae a su "fake worker", que bajo Turbopack deja page.render()
    // colgado para siempre en vez de dar un error.
    mod.GlobalWorkerOptions.workerPort = new Worker("/pdfjs/pdf.worker.min.mjs", {
      type: "module",
    });
    return mod;
  });
  return pdfjsPromise;
}

interface Lienzo {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  toBlob: () => Promise<Blob | null>;
}

/**
 * Preferimos OffscreenCanvas: con un canvas normal pdfjs avanza su render con
 * requestAnimationFrame, que no dispara si la pestaña está en segundo plano y
 * deja el render colgado. Con OffscreenCanvas usa temporizadores.
 */
function crearLienzo(width: number, height: number): Lienzo {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
    return { ctx, canvas, toBlob: () => canvas.convertToBlob({ type: "image/png" }) };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  return {
    ctx,
    canvas,
    toBlob: () => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png")),
  };
}

/**
 * Rasteriza cada página de un PDF a PNG usando el Canvas del navegador.
 *
 * Lo hacemos en el cliente a propósito: pdfjs necesita APIs de canvas que
 * node-canvas no expone, y con las que las páginas salían en blanco. Además
 * nos evita un módulo nativo en el servidor.
 */
export async function pdfToPngPages(file: File, scale = 2): Promise<PngPage[]> {
  const pdfjsLib = await loadPdfjs();
  const doc = await pdfjsLib.getDocument({
    data: await file.arrayBuffer(),
    // Servidos desde public/pdfjs; sin esto pdfjs los busca en una ruta
    // relativa que termina en file:// y el render nunca resuelve.
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
  }).promise;

  const pages: PngPage[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);
    const lienzo = crearLienzo(width, height);

    // Fondo blanco: los PDF no traen fondo y el canvas arranca transparente.
    lienzo.ctx.fillStyle = "#ffffff";
    lienzo.ctx.fillRect(0, 0, width, height);

    await page.render({
      canvasContext: lienzo.ctx as CanvasRenderingContext2D,
      canvas: lienzo.canvas as HTMLCanvasElement,
      viewport,
      // Con el intent "display", pdfjs avanza el render con
      // requestAnimationFrame, que no dispara si la pestaña está en segundo
      // plano y deja la promesa colgada. "print" usa temporizadores, y además
      // es el modo adecuado para un documento que se va a archivar/imprimir.
      intent: "print",
    }).promise;

    const blob = await lienzo.toBlob();
    if (!blob) continue;

    pages.push({ blob, width, height, pageNumber: i, totalPages: doc.numPages });
  }

  return pages;
}

/** Dimensiones reales de un archivo de imagen, para dimensionarla en el documento. */
export function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 800, height: 600 });
    };
    img.src = url;
  });
}
