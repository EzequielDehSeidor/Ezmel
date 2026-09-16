"use client";

import { useState } from "react";
import { ContratoPreview } from "./ContratoPreview";
import type { ContratoDatosSchema } from "@/lib/validation/contratoSchema";
import type { ExportFormat } from "@/lib/types/legajo";

const FORMAT_OPTIONS: { id: ExportFormat; label: string }[] = [
  { id: "docx", label: "Word (.docx)" },
  { id: "pdf", label: "PDF (.pdf)" },
];

interface Props {
  datos: ContratoDatosSchema;
  savedId: string | null;
  onSaved: (id: string) => void;
}

export function StepRevisionContrato({ datos, savedId, onSaved }: Props) {
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
      const res = await fetch("/api/contrato/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datos, formats }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "No se pudo generar la descarga");
      }

      const contratoId = res.headers.get("X-Contrato-Id");
      if (contratoId) onSaved(contratoId);

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const filename = match?.[1] ?? "contrato";

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
      <div className="max-h-[42rem] overflow-y-auto rounded-lg bg-slate-100 p-4">
        <ContratoPreview datos={datos} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Formato de descarga
        </h3>
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
          <p className="mt-3 text-sm text-emerald-600">Contrato guardado (ID {savedId}).</p>
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
  );
}
