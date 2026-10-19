"use client";

import { useFormContext } from "react-hook-form";
import { DateField } from "@/components/ui/DateField";
import type { RefinanciacionSchema } from "@/lib/validation/refinanciacionSchema";

const inputClass =
  "mt-1 w-full rounded-md border border-brand-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-900">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function StepFormularioRefinanciacion() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RefinanciacionSchema>();

  return (
    <section className="overflow-hidden rounded-lg border border-brand-border bg-white">
      <h3 className="bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white">
        Datos de la refinanciación
      </h3>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <Field label="Nombre" error={errors.nombre?.message}>
          <input className={inputClass} {...register("nombre")} />
        </Field>
        <Field label="Apellido" error={errors.apellido?.message}>
          <input className={inputClass} {...register("apellido")} />
        </Field>
        <Field label="Fecha de refinanciación" error={errors.fechaRefinanciacion?.message}>
          <DateField name="fechaRefinanciacion" className={inputClass} />
        </Field>
      </div>
    </section>
  );
}
