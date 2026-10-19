"use client";

import { useFormContext } from "react-hook-form";
import type { ContratoDatosSchema } from "@/lib/validation/contratoSchema";
import { DateField, formatDMY } from "@/components/ui/DateField";
import { desglosarIntereses } from "@/lib/contrato/buildContratoBlocks";
import { parseMontoAR } from "@/lib/format/montoAR";
import { formatDni, formatDomicilio } from "@/lib/format/personal";

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

const pesos = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
  const numeroContrato = watch("numeroContrato");

  // Lo que excede el capital son intereses más IVA (21%), así que se calculan solos.
  const prestado = parseMontoAR(watch("montoPrestado"));
  const total = parseMontoAR(montoADevolver);
  const cuota = parseMontoAR(watch("importeCuota"));
  const cuotas = Number(watch("cantidadCuotas")) || 0;
  const desglose = prestado && total ? desglosarIntereses(prestado, total) : null;
  const cuotasNoCierran = !!(total && cuota && cuotas > 0 && Math.abs(cuota * cuotas - total) > 0.05 * cuotas);

  return (
    <div className="space-y-5">
      <Section title="Datos del mutuario (personales)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" error={errors.mutuarioNombre?.message}>
            <input className={inputClass} {...register("mutuarioNombre")} />
          </Field>
          <Field label="DNI" error={errors.mutuarioDni?.message}>
            <input
              inputMode="numeric"
              className={inputClass}
              {...register("mutuarioDni", { onBlur: (e) => setValue("mutuarioDni", formatDni(e.target.value)) })}
            />
          </Field>
          <Field label="Domicilio" error={errors.mutuarioDomicilio?.message}>
            <input
              className={inputClass}
              {...register("mutuarioDomicilio", {
                onBlur: (e) => setValue("mutuarioDomicilio", formatDomicilio(e.target.value)),
              })}
            />
          </Field>
          <Field label="Email" error={errors.mutuarioEmail?.message}>
            <input type="email" className={inputClass} {...register("mutuarioEmail")} />
          </Field>
          <Field label="CBU del mutuario" error={errors.mutuarioCbu?.message}>
            <input
              inputMode="numeric"
              className={inputClass}
              placeholder="0000003100012345678901"
              {...register("mutuarioCbu")}
            />
          </Field>
          <Field label="Alias del mutuario" error={errors.mutuarioAlias?.message}>
            <input className={inputClass} placeholder="JUAN.EJEMPLO" {...register("mutuarioAlias")} />
          </Field>
        </div>
      </Section>

      <Section title="Objeto del contrato">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Importe a prestar ($)" error={errors.montoPrestado?.message}>
            <input type="text" inputMode="decimal" placeholder="0" className={inputClass} {...register("montoPrestado")} />
          </Field>
          <Field label="Suma total ($)" error={errors.montoADevolver?.message}>
            <input type="text" inputMode="decimal" placeholder="0" className={inputClass} {...register("montoADevolver")} />
          </Field>
        </div>
      </Section>

      <Section title="Forma de devolución">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Suma total ($)">
            <input readOnly tabIndex={-1} className={readOnlyInputClass} value={montoADevolver || ""} />
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
                    className="h-4 w-4 rounded border-brand-border accent-[#1a5f6f]"
                    checked={periodicidadPago === opt.id}
                    onChange={() => setValue("periodicidadPago", opt.id, { shouldValidate: true })}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <Field label="Importe por cuota ($)" error={errors.importeCuota?.message}>
            <input type="text" inputMode="decimal" placeholder="0" className={inputClass} {...register("importeCuota")} />
          </Field>
          <Field label="Fecha de inicio" error={errors.fechaPrimeraCuota?.message}>
            <DateField name="fechaPrimeraCuota" className={inputClass} />
          </Field>
        </div>
        {cuotasNoCierran && (
          <p className="mt-3 text-sm text-amber-700">
            El importe por cuota por la cantidad de cuotas no coincide con la suma total: revisá los montos.
          </p>
        )}
      </Section>

      <Section title="Tasas e intereses">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="TNA – Tasa Nominal Anual (%)" error={errors.tna?.message}>
            <input type="text" inputMode="decimal" placeholder="437,19" className={inputClass} {...register("tna")} />
          </Field>
          <Field label="TEM – Tasa Efectiva Mensual (%)" error={errors.tem?.message}>
            <input type="text" inputMode="decimal" placeholder="36,43" className={inputClass} {...register("tem")} />
          </Field>
          <Field label="TEA – Tasa Efectiva Anual (%)" error={errors.tea?.message}>
            <input type="text" inputMode="decimal" placeholder="4.059,16" className={inputClass} {...register("tea")} />
          </Field>
          <Field label="CFTEA con IVA (%)" error={errors.cftea?.message}>
            <input type="text" inputMode="decimal" placeholder="7.904,87" className={inputClass} {...register("cftea")} />
          </Field>
          <Field label="Total de intereses compensatorios ($)">
            <input
              readOnly
              tabIndex={-1}
              className={readOnlyInputClass}
              value={desglose ? pesos.format(desglose.intereses) : ""}
            />
          </Field>
          <Field label="IVA sobre intereses ($)">
            <input
              readOnly
              tabIndex={-1}
              className={readOnlyInputClass}
              value={desglose ? pesos.format(desglose.iva) : ""}
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Los intereses y el IVA (21%) se calculan solos con la diferencia entre la suma total y el importe a prestar.
        </p>
      </Section>

      <Section title="Número y fecha del contrato">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Número de contrato" error={errors.numeroContrato?.message}>
            <input inputMode="numeric" placeholder="000001" className={inputClass} {...register("numeroContrato")} />
          </Field>
          <Field label="Fecha de contrato" error={errors.fechaContrato?.message}>
            <DateField name="fechaContrato" className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Pagaré">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Número de pagaré">
            <input
              readOnly
              tabIndex={-1}
              className={readOnlyInputClass}
              value={numeroContrato ? numeroContrato.padStart(6, "0") : ""}
            />
          </Field>
          <Field label="Importe ($)">
            <input readOnly tabIndex={-1} className={readOnlyInputClass} value={montoADevolver || ""} />
          </Field>
          <Field label="Vence el día" error={errors.fechaVencimientoPagare?.message}>
            <DateField name="fechaVencimientoPagare" className={inputClass} />
          </Field>
          <Field label="Fecha de contrato">
            <input readOnly tabIndex={-1} className={readOnlyInputClass} value={formatDMY(fechaContrato)} />
          </Field>
          <Field label="Suma total ($)">
            <input readOnly tabIndex={-1} className={readOnlyInputClass} value={montoADevolver || ""} />
          </Field>
        </div>
      </Section>
    </div>
  );
}
