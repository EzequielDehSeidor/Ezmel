"use client";

import { useState } from "react";
import { FolderIcon, UploadIcon } from "@/components/layout/icons";
import { PanelOpciones } from "@/components/layout/PanelOpciones";
import { LegajoWizard } from "./LegajoWizard";

const OPCIONES = [
  { id: "crear", label: "Crear legajo", titulo: "Crear legajo", Icon: FolderIcon },
  { id: "cargar", label: "Cargar legajo", titulo: "Cargar legajo", Icon: UploadIcon },
] as const;

type OpcionId = (typeof OPCIONES)[number]["id"];

/** Contenido del legajo + panel de opciones a la derecha (arriba en pantallas chicas). */
export function LegajosPanel() {
  const [opcion, setOpcion] = useState<OpcionId>("crear");
  const actual = OPCIONES.find((o) => o.id === opcion) ?? OPCIONES[0];

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <PanelOpciones titulo="Legajos" opciones={OPCIONES} seleccion={opcion} onSelect={setOpcion} />

      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold text-brand">{actual.titulo}</h1>
        {/* El wizard queda montado para no perder lo cargado al cambiar de opción. */}
        <div hidden={opcion !== "crear"}>
          <LegajoWizard />
        </div>
        {opcion === "cargar" && (
          <div className="rounded-2xl border border-dashed border-brand-border bg-white p-10 text-center text-sm text-slate-500">
            Esta sección está en definición.
          </div>
        )}
      </div>
    </div>
  );
}
