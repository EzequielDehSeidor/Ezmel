export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-4">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i === current
                ? "bg-brand text-white"
                : i < current
                  ? "bg-brand-soft text-brand"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {i + 1}
          </span>
          <span className={`text-sm ${i === current ? "font-bold text-brand" : "text-slate-600"}`}>
            {label}
          </span>
          {i < steps.length - 1 && <span className="mx-2 h-px w-8 bg-brand-border" />}
        </li>
      ))}
    </ol>
  );
}
