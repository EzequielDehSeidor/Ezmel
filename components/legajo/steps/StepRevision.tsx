"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { CHECKLIST_LABELS } from "@/lib/types/legajo";
import type { ExportFormat, LegajoFileCategoryKey, LegajoFormValues } from "@/lib/types/legajo";
import { LegajoDocumentPreview } from "@/components/legajo/LegajoDocumentPreview";
import { prepareUpload } from "@/lib/export/prepareUpload";

const FORMAT_OPTIONS: { id: ExportFormat; label: string }[] = [
  { id: "docx", label: "Word (.docx)" },
  { id: "pdf", label: "PDF (.pdf)" },
  { id: "xlsx", label: "Excel (.xlsx)" },
];

const inputClass =
  "mt-1 w-full rounded-md border border-brand-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none";

interface Props {
  files: Partial<Record<LegajoFileCategoryKey, File[]>>;
  savedId: string | null;
  onSaved: (id: string) => void;
  onEditar: () => void;
}

export function StepRevision({ files, savedId, onSaved, onEditar }: Props) {
  const { register, watch } = useFormContext<LegajoFormValues>();
  const data = watch();

  const [formats, setFormats] = useState<ExportFormat[]>(["docx"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFormat(id: ExportFormat) {
    setFormats((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  async function handleDownload() {
    if (formats.length === 0) {
      setError("Elegí al menos un formato de descarga.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Los PDF se rasterizan acá, en el navegador, y viajan como imágenes.
      const { meta, blobs } = await prepareUpload(files);

      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      formData.append("formats", JSON.stringify(formats));
      formData.append("meta", JSON.stringify(meta));
      for (const { category, blob, filename } of blobs) {
        formData.append(category, blob, filename);
      }

      const res = await fetch("/api/export", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "No se pudo generar la descarga");
      }

      const legajoId = res.headers.get("X-Legajo-Id");
      if (legajoId) onSaved(legajoId);

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const filename = match?.[1] ?? "legajo";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Revisión</h2>
        <button type="button" onClick={onEditar} className="text-sm text-slate-500 hover:underline">
          Editar datos
        </button>
      </div>

      <div className="max-h-[42rem] overflow-y-auto rounded-lg bg-slate-100 p-4">
        <LegajoDocumentPreview data={data} files={files} />
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border bg-white">
        <h3 className="bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white">
          Checklist final
        </h3>
        <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-2">
          {(Object.keys(CHECKLIST_LABELS) as (keyof typeof CHECKLIST_LABELS)[]).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-900">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-brand-border accent-[#17284a]"
                {...register(`checklist.${key}`)}
              />
              {CHECKLIST_LABELS[key]}
            </label>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border bg-white">
        <h3 className="bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white">
          Responsable del legajo
        </h3>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <label className="block">
            <span className="block text-sm font-semibold text-slate-900">Responsable</span>
            <input
              placeholder="Nombre de quien arma el legajo"
              className={inputClass}
              {...register("responsable")}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-slate-900">Fecha</span>
            <input type="date" className={inputClass} {...register("fechaResponsable")} />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border bg-white">
        <h3 className="bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white">
          Formato de descarga
        </h3>
        <div className="p-5">
        <div className="flex flex-wrap gap-4">
          {FORMAT_OPTIONS.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-900">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-brand-border accent-[#17284a]"
                checked={formats.includes(opt.id)}
                onChange={() => toggleFormat(opt.id)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {savedId && !error && (
          <p className="mt-3 text-sm text-emerald-600">Legajo guardado (ID {savedId}).</p>
        )}

        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {loading ? "Generando..." : "Guardar y descargar"}
        </button>
        </div>
      </div>
    </div>
  );
}
