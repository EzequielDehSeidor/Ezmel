"use client";

import { useEffect, useState } from "react";

/**
 * Object URL para previsualizar un File, liberado cuando el archivo cambia o
 * el componente se desmonta. `enabled` en false devuelve null (p. ej. PDFs,
 * que se renderizan aparte página por página).
 *
 * La URL se crea DENTRO del efecto, no con useMemo: en modo estricto React
 * monta, desmonta y vuelve a montar, y con useMemo el valor memorizado
 * sobrevive a esa limpieza que ya lo revocó — dejando las imágenes rotas.
 */
export function useObjectUrl(file: File, enabled = true): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;

    // En una microtarea para no llamar a setState en el cuerpo del efecto.
    Promise.resolve().then(() => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(file);
      setUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [file, enabled]);

  return url;
}
