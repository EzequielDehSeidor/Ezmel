"use client";

import { useFormContext } from "react-hook-form";
import type { LegajoFormValues } from "@/lib/types/legajo";

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

export function StepDatosPersonales() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<LegajoFormValues>();

  const servicios = watch("servicios");

  return (
    <div className="space-y-5">
      <Section title="Datos generales">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre y Apellido" error={errors.nombreApellido?.message}>
            <input className={inputClass} {...register("nombreApellido")} />
          </Field>
          <Field label="N.º de Préstamo" error={errors.numeroPrestamo?.message}>
            <input className={inputClass} {...register("numeroPrestamo")} />
          </Field>
          <Field label="DNI" error={errors.dni?.message}>
            <input className={inputClass} {...register("dni")} />
          </Field>
          <Field label="Fecha de Apertura del Legajo" error={errors.fechaApertura?.message}>
            <input type="date" className={inputClass} {...register("fechaApertura")} />
          </Field>
        </div>
      </Section>

      <Section title="Datos personales">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" error={errors.nombre?.message}>
            <input className={inputClass} {...register("nombre")} />
          </Field>
          <Field label="Apellido" error={errors.apellido?.message}>
            <input className={inputClass} {...register("apellido")} />
          </Field>
          <Field label="Teléfono" error={errors.telefono?.message}>
            <input className={inputClass} {...register("telefono")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" className={inputClass} {...register("email")} />
          </Field>
          <Field label="Dirección">
            <input className={inputClass} {...register("direccion")} />
          </Field>
          <Field label="Código postal">
            <input className={inputClass} {...register("codigoPostal")} />
          </Field>
          <Field label="Referencias">
            <input className={inputClass} {...register("referencias")} />
          </Field>
        </div>
      </Section>

      <Section title="Monto de préstamo">
        <div className="max-w-xs">
          <Field label="Monto de Préstamo ($)">
            <input type="number" step="0.01" className={inputClass} {...register("montoPrestamo")} />
          </Field>
        </div>
      </Section>

      <Section title="Servicios">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-brand">
                <th className="pb-2 pr-2">Servicio</th>
                <th className="pb-2 pr-2">Titular</th>
                <th className="pb-2 pr-2">Fecha</th>
                <th className="pb-2">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((row, i) => (
                <tr key={row.servicio} className="border-t border-slate-100">
                  <td className="py-2 pr-2 font-semibold text-slate-900">{row.servicio}</td>
                  <td className="py-2 pr-2">
                    <input className={inputClass} {...register(`servicios.${i}.titular`)} />
                  </td>
                  <td className="py-2 pr-2">
                    <input type="date" className={inputClass} {...register(`servicios.${i}.fecha`)} />
                  </td>
                  <td className="py-2">
                    <input className={inputClass} {...register(`servicios.${i}.observaciones`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Observaciones generales">
        <textarea
          rows={3}
          className={inputClass}
          {...register("observacionesGenerales")}
        />
      </Section>

    </div>
  );
}
