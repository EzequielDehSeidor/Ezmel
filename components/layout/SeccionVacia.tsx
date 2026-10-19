export function SeccionVacia({ titulo }: { titulo: string }) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-brand">{titulo}</h1>
      <div className="rounded-2xl border border-dashed border-brand-border bg-white p-10 text-center text-sm text-slate-500">
        Esta sección está en definición.
      </div>
    </>
  );
}
