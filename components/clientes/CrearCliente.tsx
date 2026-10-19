"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clienteSchema, type ClienteSchema } from "@/lib/validation/clienteSchema";

const inputClass =
  "mt-1 w-full rounded-md border border-brand-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-900">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

/** Alta de cliente con los datos personales que ya pide el legajo. */
export function CrearCliente({ onCrear }: { onCrear: (datos: ClienteSchema) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClienteSchema>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { nombre: "", apellido: "", dni: "", email: "", telefono: "", direccion: "", codigoPostal: "", referencias: "" },
    mode: "onBlur",
  });

  function onSubmit(datos: ClienteSchema) {
    onCrear(datos);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-brand-border bg-white">
        <h3 className="bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white">Datos personales</h3>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="Nombre" error={errors.nombre?.message}>
            <input className={inputClass} {...register("nombre")} />
          </Field>
          <Field label="Apellido" error={errors.apellido?.message}>
            <input className={inputClass} {...register("apellido")} />
          </Field>
          <Field label="DNI" error={errors.dni?.message}>
            <input className={inputClass} inputMode="numeric" {...register("dni")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" className={inputClass} {...register("email")} />
          </Field>
          <Field label="Teléfono" error={errors.telefono?.message}>
            <input className={inputClass} {...register("telefono")} />
          </Field>
          <Field label="Dirección" error={errors.direccion?.message}>
            <input className={inputClass} {...register("direccion")} />
          </Field>
          <Field label="Código postal" error={errors.codigoPostal?.message}>
            <input className={inputClass} {...register("codigoPostal")} />
          </Field>
          <Field label="Referencias" error={errors.referencias?.message}>
            <input className={inputClass} {...register("referencias")} />
          </Field>
        </div>
      </section>

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Guardar cliente
        </button>
      </div>
    </form>
  );
}
