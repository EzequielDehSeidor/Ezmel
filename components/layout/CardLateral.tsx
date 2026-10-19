"use client";

import { useState, type ReactNode } from "react";
import { ChevronRightIcon } from "./icons";

/**
 * Columna a la derecha del contenido (arriba en pantallas chicas); apila una o más cards.
 * `fija` la deja pegada mientras se scrollea; no conviene si las cards pueden ser más altas que la pantalla.
 */
export function ColumnaLateral({
  ancho = "xl:w-80",
  fija = true,
  children,
}: {
  ancho?: string;
  fija?: boolean;
  children: ReactNode;
}) {
  return (
    <aside className={`space-y-4 xl:order-last xl:shrink-0 ${fija ? "xl:sticky xl:top-0" : ""} ${ancho}`}>
      {children}
    </aside>
  );
}

/** Card plegable con título. */
export function CardLateral({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(true);

  return (
    <section className="rounded-2xl border border-brand-border p-4">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold text-brand"
      >
        {titulo}
        <ChevronRightIcon className={`h-4 w-4 transition-transform ${abierto ? "rotate-90" : ""}`} />
      </button>

      {abierto && <div className="mt-3">{children}</div>}
    </section>
  );
}
