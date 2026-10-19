"use client";

import type { ReactNode } from "react";
import { CardLateral, ColumnaLateral } from "./CardLateral";

export type OpcionPanel<Id extends string> = {
  id: Id;
  label: string;
  Icon: (props: { className?: string }) => ReactNode;
};

/** Card con opciones para elegir qué se muestra en el contenido; admite cards extra debajo. */
export function PanelOpciones<Id extends string>({
  titulo,
  opciones,
  seleccion,
  onSelect,
  ancho,
  fija,
  children,
}: {
  titulo: string;
  opciones: readonly OpcionPanel<Id>[];
  seleccion: Id;
  onSelect: (id: Id) => void;
  ancho?: string;
  fija?: boolean;
  children?: ReactNode;
}) {
  return (
    <ColumnaLateral ancho={ancho} fija={fija}>
      <CardLateral titulo={titulo}>
        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap xl:flex-col">
          {opciones.map(({ id, label, Icon }) => {
            const active = id === seleccion;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                aria-pressed={active}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                  active ? "bg-brand-mid/15 text-brand" : "text-slate-700 hover:bg-brand-mid/10"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-brand-mid" : "text-slate-500"}`} />
                {label}
              </button>
            );
          })}
        </div>
      </CardLateral>
      {children}
    </ColumnaLateral>
  );
}
