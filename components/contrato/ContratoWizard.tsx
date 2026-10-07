"use client";

import { useState } from "react";
import { FormProvider, useForm, type DefaultValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contratoDatosSchema, type ContratoDatosSchema } from "@/lib/validation/contratoSchema";
import { StepIndicator } from "@/components/legajo/StepIndicator";
import { StepFormularioContrato } from "./StepFormularioContrato";
import { StepRevisionContrato } from "./StepRevisionContrato";

// Los montos arrancan vacíos (se muestran con placeholder) para poder escribir sin borrar un "0".
const defaultValues: DefaultValues<ContratoDatosSchema> = {
  mutuarioNombre: "",
  mutuarioDni: "",
  mutuarioDomicilio: "",
  mutuarioEmail: "",
  cantidadCuotas: 1,
  periodicidadPago: "mensual",
  fechaPrimeraCuota: "",
  diasHabilesPago: 10,
  fechaContrato: "",
  fechaVencimientoPagare: "",
  garanteNombre: "",
  garanteDni: "",
};

const STEPS = ["Datos del contrato", "Contrato final"];

const CONTRATO_STEP1_FIELDS: (keyof ContratoDatosSchema)[] = [
  "mutuarioNombre",
  "mutuarioDni",
  "mutuarioDomicilio",
  "mutuarioEmail",
  "montoPrestado",
  "montoADevolver",
  "cantidadCuotas",
  "importeCuota",
  "periodicidadPago",
  "fechaPrimeraCuota",
  "diasHabilesPago",
  "fechaContrato",
  "fechaVencimientoPagare",
];

export function ContratoWizard() {
  const [step, setStep] = useState(0);
  const [datos, setDatos] = useState<ContratoDatosSchema | null>(null);

  const methods = useForm<ContratoDatosSchema>({
    resolver: zodResolver(contratoDatosSchema) as Resolver<ContratoDatosSchema>,
    defaultValues,
    mode: "onBlur",
  });

  async function goNext() {
    const valid = await methods.trigger(CONTRATO_STEP1_FIELDS);
    if (!valid) return;
    const parsed = contratoDatosSchema.safeParse(methods.getValues());
    if (!parsed.success) return;
    setDatos(parsed.data);
    setStep(1);
  }

  function goBack() {
    setStep(0);
  }

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        <StepIndicator steps={STEPS} current={step} />

        {step === 0 && <StepFormularioContrato />}
        {step === 1 && datos && (
          <StepRevisionContrato datos={datos} />
        )}

        <div className="flex justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="rounded-md border border-brand-border px-4 py-2 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-40"
          >
            Atrás
          </button>
          {step === 0 && (
            <button
              type="button"
              onClick={goNext}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
