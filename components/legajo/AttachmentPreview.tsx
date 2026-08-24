"use client";

import { PdfPagesPreview } from "./PdfPagesPreview";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";
import { isPdfFile } from "@/lib/types/legajo";

/** Muestra un adjunto a tamaño completo: imagen, o todas las páginas si es PDF. */
export function AttachmentPreview({ file }: { file: File }) {
  const isPdf = isPdfFile(file);
  const url = useObjectUrl(file, !isPdf);

  if (isPdf) {
    return (
      <div>
        <p className="mb-1 text-xs font-semibold text-[#17284a]">{file.name}</p>
        <PdfPagesPreview file={file} />
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-[#17284a]">{file.name}</p>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="w-full rounded-md border border-[#c8d3e6]" />
      )}
    </div>
  );
}
