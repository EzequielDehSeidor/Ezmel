"use client";

import { useEffect, useState } from "react";
import { pdfToPngPages } from "@/lib/pdf/pdfToPngPages";

/** Renderiza todas las páginas de un PDF, en el navegador, para la vista previa del legajo. */
export function PdfPagesPreview({ file }: { file: File }) {
  const [pages, setPages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let urls: string[] = [];

    pdfToPngPages(file, 1.5)
      .then((rendered) => {
        if (cancelled) return;
        urls = rendered.map((p) => URL.createObjectURL(p.blob));
        setPages(urls);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo generar la vista previa de este PDF.");
      });

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [file]);

  if (error) return <p className="text-xs text-red-600">{error}</p>;
  if (!pages) return <p className="text-xs text-slate-500">Generando vista previa del PDF…</p>;

  return (
    <div className="space-y-3">
      {pages.length > 1 && (
        <p className="text-xs font-medium text-slate-600">{pages.length} páginas</p>
      )}
      {pages.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt={`${file.name} — página ${i + 1}`}
          className="w-full rounded-md border border-[#c8d3e6]"
        />
      ))}
    </div>
  );
}
