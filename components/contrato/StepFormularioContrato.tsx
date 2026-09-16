"use client";

import { useFormContext } from "react-hook-form";
import type { ContratoDatosSchema } from "@/lib/validation/contratoSchema";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-900">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const inputClass =
  "mt-1 w-full rounded-md border border-brand-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none";

const readOnlyInputClass =
  "mt-1 w-full rounded-md border border-brand-border bg-slate-100 px-3 py-2 text-sm text-slate-500";

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

const PERIODICIDAD_OPTIONS: { id: "mensual" | "quincenal" | "semanal"; label: string }[] = [
  { id: "mensual", label: "Mensual" },
  { id: "quincenal", label: "Quincenal" },
  { id: "semanal", label: "Semanal" },
];

export function StepFormularioContrato() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ContratoDatosSchema>();

  const montoADevolver = watch("montoADevolver");
  const fechaContrato = watch("fechaContrato");
  const periodicidadPago = watch("periodicidadPago");

  return (
    <div className="space-y-5">
      <Section title="Datos del mutuario (personales)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" error={errors.mutuarioNombre?.message}>
            <input className={inputClass} {...register("mutuarioNombre")} />
          </Field>
          <Field label="DNI" error={errors.mutuarioDni?.message}>
            <input className={inputClass} {...register("mutuarioDni")} />
          </Field>
          <Field label="Domicilio" error={errors.mutuarioDomicilio?.message}>
            <input className={inputClass} {...register("mutuarioDomicilio")} />
          </Field>
          <Field label="Email" error={errors.mutuarioEmail?.message}>
            <input type="email" className={inputClass} {...register("mutuarioEmail")} />
          </Field>
        </div>
      </Section>

      <Section title="Objeto del contrato">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Importe a prestar ($)" error={errors.montoPrestado?.message}>
            <input type="number" step="1" className={inputClass} {...register("montoPrestado")} />
          </Field>
          <Field label="Suma total ($)" error={errors.montoADevolver?.message}>
            <input type="number" step="1" className={inputClass} {...register("montoADevolver")} />
          </Field>
        </div>
      </Section>

      <Section title="Forma de devolución">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Suma total ($)">
            <input type="number" readOnly tabIndex={-1} className={readOnlyInputClass} value={montoADevolver || ""} />
          </Field>
          <div>
            <Field label="Cantidad de cuotas" error={errors.cantidadCuotas?.message}>
              <input
                type="number"
                step="1"
                min="1"
                className={inputClass}
                {...register("cantidadCuotas")}
              />
            </Field>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {PERIODICIDAD_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-1.5 text-sm text-slate-900">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-brand-border accent-[#17284a]"
                    checked={periodicidadPago === opt.id}
                    onChange={() => setValue("periodicidadPago", opt.id, { shouldValidate: true })}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <Field label="Importe por cuota ($)" error={errors.importeCuota?.message}>
            <input type="number" step="1" className={inputClass} {...register("importeCuota")} />
          </Field>
          <Field label="Fecha de inicio" error={errors.fechaPrimeraCuota?.message}>
            <input type="date" className={inputClass} {...register("fechaPrimeraCuota")} />
          </Field>
          <Field label="Días hábiles para pagar cada cuota" error={errors.diasHabilesPago?.message}>
            <input type="number" step="1" min="1" className={inputClass} {...register("diasHabilesPago")} />
          </Field>
        </div>
      </Section>

      <Section title="Décima tercera – Domicilios">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fecha de contrato" error={errors.fechaContrato?.message}>
            <input type="date" className={inputClass} {...register("fechaContrato")} />
          </Field>
        </div>
      </Section>

      <Section title="Pagaré">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Importe ($)">
            <input type="number" readOnly tabIndex={-1} className={readOnlyInputClass} value={montoADevolver || ""} />
          </Field>
          <Field label="Vence el día" error={errors.fechaVencimientoPagare?.message}>
            <input type="date" className={inputClass} {...register("fechaVencimientoPagare")} />
          </Field>
          <Field label="Fecha de contrato">
            <input readOnly tabIndex={-1} className={readOnlyInputClass} value={fechaContrato || ""} />
          </Field>
          <Field label="Suma total ($)">
            <input type="number" readOnly tabIndex={-1} className={readOnlyInputClass} value={montoADevolver || ""} />
          </Field>
        </div>
      </Section>
    </div>
  );
}
