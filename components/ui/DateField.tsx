"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useController, useFormContext } from "react-hook-form";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/layout/icons";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const pad = (n: number) => String(n).padStart(2, "0");

function parseIso(value?: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
}

/** "2026-10-05" -> "05/10/2026" (vacío si no hay fecha). */
export function formatDMY(value?: string) {
  const p = parseIso(value);
  return p ? `${pad(p.d)}/${pad(p.m + 1)}/${p.y}` : "";
}

/**
 * Campo de fecha con calendario propio. Guarda el valor como "AAAA-MM-DD",
 * igual que el input nativo, así que el resto de la app no cambia.
 */
export function DateField({ name, className = "" }: { name: string; className?: string }) {
  const { control } = useFormContext();
  const { field } = useController({ name, control });
  const value = typeof field.value === "string" ? field.value : "";
  const selected = parseIso(value);

  const now = new Date();
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };

  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ y: (selected ?? today).y, m: (selected ?? today).m });
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // El calendario se dibuja fuera de la tarjeta (portal) para que no lo recorte su overflow.
  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const h = popRef.current?.offsetHeight ?? 340;
    const cabeAbajo = window.innerHeight - r.bottom >= h + 16;
    const top = cabeAbajo || r.top < h + 16 ? r.bottom + 8 : r.top - h - 8;
    const left = Math.max(12, Math.min(r.left, window.innerWidth - 288 - 12));
    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      field.onBlur();
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !popRef.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, field, place]);

  function toggle() {
    if (!open) {
      const base = selected ?? today;
      setView({ y: base.y, m: base.m });
      place();
    }
    setOpen((o) => !o);
  }

  function pick(y: number, m: number, d: number) {
    field.onChange(`${y}-${pad(m + 1)}-${pad(d)}`);
    setOpen(false);
    field.onBlur();
  }

  function clear() {
    field.onChange("");
    setOpen(false);
    field.onBlur();
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const total = v.y * 12 + v.m + delta;
      return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
    });
  }

  const lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${className} flex items-center justify-between gap-2 text-left`}
      >
        <span className={value ? "" : "text-slate-500"}>{formatDMY(value) || "dd/mm/aaaa"}</span>
        <CalendarIcon className="h-4 w-4 text-brand" />
      </button>

      {open &&
        createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label="Elegir fecha"
          onClick={(e) => e.preventDefault()}
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          className="z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-brand-border bg-white p-4 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-bold text-brand">
              {MESES[view.m]} {view.y}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => shiftMonth(-1)}
                className="rounded-full p-1.5 text-slate-700 hover:bg-brand-soft"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => shiftMonth(1)}
                className="rounded-full p-1.5 text-slate-700 hover:bg-brand-soft"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500">
            {DIAS.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-y-1 text-center">
            {cells.map((day, i) => {
              if (day === null) return <span key={`b${i}`} />;
              const isSelected = !!selected && selected.y === view.y && selected.m === view.m && selected.d === day;
              const isToday = today.y === view.y && today.m === view.m && today.d === day;
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => pick(view.y, view.m, day)}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                    isSelected
                      ? "bg-brand-mid font-bold text-white"
                      : `text-slate-800 hover:bg-brand-soft ${isToday ? "ring-2 ring-[#6ACEC6]" : ""}`
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-between border-t border-brand-border pt-3 text-sm">
            <button
              type="button"
              onClick={() => pick(today.y, today.m, today.d)}
              className="font-semibold text-brand-mid hover:underline"
            >
              Hoy
            </button>
            <button type="button" onClick={clear} className="text-slate-600 hover:underline">
              Borrar
            </button>
          </div>
        </div>,
        document.body
        )}
    </div>
  );
}
