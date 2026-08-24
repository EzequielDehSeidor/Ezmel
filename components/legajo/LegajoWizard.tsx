"use client";

import { useState } from "react";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { legajoFormSchema, STEP1_FIELDS } from "@/lib/validation/legajoSchema";
import type { LegajoFileCategoryKey, LegajoFormValues } from "@/lib/types/legajo";
import { SERVICIOS_DEFAULT } from "@/lib/types/legajo";
import { StepIndicator } from "./StepIndicator";
import { StepDatosPersonales } from "./steps/StepDatosPersonales";
import { StepDocumentacion } from "./steps/StepDocumentacion";
import { StepRevision } from "./steps/StepRevision";

const defaultValues: LegajoFormValues = {
  nombreApellido: "",
  numeroPrestamo: "",
  dni: "",
  fechaApertura: "",
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
  direccion: "",
  codigoPostal: "",
  referencias: "",
  montoPrestamo: 0,
  servicios: SERVICIOS_DEFAULT.map((servicio) => ({
    servicio,
    titular: "",
    fecha: "",
    observaciones: "",
  })),
  observacionesGenerales: "",
  checklist: {
    documentacionCompleta: false,
    dniVerificado: false,
    haberesVerificados: false,
    serviciosVerificados: false,
    capturasIncorporadas: false,
    legajoCompleto: false,
  },
  responsable: "",
  fechaResponsable: "",
  dniObs: "",
  haberesObs: "",
  serviciosObs: "",
  transferenciasObs: "",
  capturasVariasObs: "",
};

const STEPS = ["Datos de la persona", "Documentación", "Revisión y descarga"];

export function LegajoWizard() {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<Partial<Record<LegajoFileCategoryKey, File[]>>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const methods = useForm<LegajoFormValues>({
    resolver: zodResolver(legajoFormSchema) as Resolver<LegajoFormValues>,
    defaultValues,
    mode: "onBlur",
  });

  async function goNext() {
    if (step === 0) {
      const valid = await methods.trigger(STEP1_FIELDS as unknown as (keyof LegajoFormValues)[]);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        <StepIndicator steps={STEPS} current={step} />

        {step === 0 && <StepDatosPersonales />}
        {step === 1 && <StepDocumentacion files={files} setFiles={setFiles} />}
        {step === 2 && (
          <StepRevision
            files={files}
            savedId={savedId}
            onSaved={setSavedId}
            onEditar={() => setStep(0)}
          />
        )}

        {step < 2 && (
          <div className="flex justify-between border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="rounded-md border border-brand-border px-4 py-2 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-40"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
            >
              Siguiente
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={goBack}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Atrás
            </button>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
