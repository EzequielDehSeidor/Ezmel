"use client";

import { useState } from "react";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { formatAmountInput, parseCurrencyAR } from "@/lib/format/currency";

interface Props<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  className: string;
}

/** Input de monto con formato argentino (punto de miles, coma decimal) en vivo. */
export function CurrencyInput<T extends FieldValues>({ name, control, className }: Props<T>) {
  const { field } = useController({ name, control });
  const numericValue = typeof field.value === "number" ? field.value : Number(field.value) || 0;

  const [text, setText] = useState(() => formatAmountInput(numericValue));
  // Si el valor cambia desde afuera (reset del form, etc.) reformateamos el
  // texto durante el render, no en un efecto: evita un ida-y-vuelta de renders.
  const [lastSynced, setLastSynced] = useState(numericValue);
  if (numericValue !== lastSynced) {
    setLastSynced(numericValue);
    setText(formatAmountInput(numericValue));
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const parsed = parseCurrencyAR(e.target.value);
        field.onChange(parsed);
        setLastSynced(parsed);
      }}
      onBlur={() => {
        field.onBlur();
        const parsed = parseCurrencyAR(text);
        setText(formatAmountInput(parsed));
      }}
    />
  );
}
