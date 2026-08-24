"use client";

import { useFormContext } from "react-hook-form";
import { ACCEPTED_FILE_ACCEPT, FILE_CATEGORIES, isImageFile } from "@/lib/types/legajo";
import type { LegajoFileCategoryKey, LegajoFormValues } from "@/lib/types/legajo";
import { useObjectUrl } from "@/lib/hooks/useObjectUrl";

const inputClass =
  "mt-1 w-full rounded-md border border-brand-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none";

interface Props {
  files: Partial<Record<LegajoFileCategoryKey, File[]>>;
  setFiles: React.Dispatch<React.SetStateAction<Partial<Record<LegajoFileCategoryKey, File[]>>>>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-brand-border bg-white">
      <h3 className="bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white">
        {title}
      </h3>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Miniatura de un adjunto; crea y libera su object URL con el ciclo de vida del archivo. */
function FileThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = isImageFile(file);
  const url = useObjectUrl(file, isImage);

  return (
    <li className="flex w-40 flex-col overflow-hidden rounded-md border border-brand-border">
      {isImage && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="h-24 w-full object-cover" />
      ) : (
        <div className="flex h-24 w-full items-center justify-center bg-brand-soft text-xs font-bold text-brand">
          {isImage ? "…" : "PDF"}
        </div>
      )}
      <div className="flex items-center justify-between gap-1 px-2 py-1">
        <span className="truncate text-xs text-slate-700" title={file.name}>
          {file.name}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-xs font-medium text-red-600 hover:underline"
        >
          Quitar
        </button>
      </div>
    </li>
  );
}

export function StepDocumentacion({ files, setFiles }: Props) {
  const { register } = useFormContext<LegajoFormValues>();

  function addFiles(key: LegajoFileCategoryKey, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    // Copiamos la FileList ACÁ: el updater de setState corre después de que
    // limpiamos el input, y para entonces `fileList` ya quedó vacía.
    const added = Array.from(fileList);
    setFiles((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), ...added],
    }));
  }

  function removeFile(key: LegajoFileCategoryKey, index: number) {
    setFiles((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="space-y-5">
      {FILE_CATEGORIES.map((category) => {
        const categoryFiles = files[category.key] ?? [];

        return (
          <Section key={category.key} title={category.label}>
            <input
              type="file"
              multiple
              accept={ACCEPTED_FILE_ACCEPT}
              onChange={(e) => {
                addFiles(category.key, e.target.files);
                e.target.value = "";
              }}
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-hover"
            />
            <p className="mt-1 text-xs text-slate-500">
              Podés elegir varios archivos (imágenes o PDF). Los PDF se incluyen con todas sus páginas.
            </p>

            {categoryFiles.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-3">
                {categoryFiles.map((file, i) => (
                  <FileThumb
                    key={`${file.name}-${file.lastModified}-${i}`}
                    file={file}
                    onRemove={() => removeFile(category.key, i)}
                  />
                ))}
              </ul>
            )}

            <textarea
              rows={2}
              placeholder="Observaciones"
              className={`${inputClass} mt-3`}
              {...register(category.obsKey)}
            />
          </Section>
        );
      })}

    </div>
  );
}
