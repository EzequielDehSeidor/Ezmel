"use client";

import { useState } from "react";
import { FileTextIcon, HistoryIcon } from "@/components/layout/icons";
import { PanelOpciones } from "@/components/layout/PanelOpciones";
import { ContratoWizard } from "./ContratoWizard";
import { RefinanciacionWizard } from "@/components/refinanciacion/RefinanciacionWizard";

// Para sumar otro tipo de contrato: una entrada acá y su bloque en el contenido.
const TIPOS = [
  { id: "mutuo", label: "Contrato de mutuo y pagaré", titulo: "Crear contrato", Icon: FileTextIcon },
  { id: "refinanciacion", label: "Refinanciación", titulo: "Crear refinanciación", Icon: HistoryIcon },
] as const;

type TipoId = (typeof TIPOS)[number]["id"];

/** Contenido del contrato + panel de tipos a la derecha (arriba en pantallas chicas). */
export function ContratosPanel() {
  const [tipo, setTipo] = useState<TipoId>("mutuo");
  const actual = TIPOS.find((t) => t.id === tipo) ?? TIPOS[0];

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <PanelOpciones titulo="Tipo de contrato" opciones={TIPOS} seleccion={tipo} onSelect={setTipo} />

      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold text-brand">{actual.titulo}</h1>
        {/* Ambos quedan montados para no perder lo cargado al cambiar de tipo. */}
        <div hidden={tipo !== "mutuo"}>
          <ContratoWizard />
        </div>
        <div hidden={tipo !== "refinanciacion"}>
          <RefinanciacionWizard />
        </div>
      </div>
    </div>
  );
}
