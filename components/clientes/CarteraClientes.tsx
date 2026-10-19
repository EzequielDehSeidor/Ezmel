"use client";

import { useState } from "react";
import { CardLateral } from "@/components/layout/CardLateral";
import { UserPlusIcon, UsersIcon } from "@/components/layout/icons";
import { PanelOpciones } from "@/components/layout/PanelOpciones";
import { CLIENTES_MOCK, type ClienteMock, type EstadoCliente } from "@/lib/clientes/mock";
import type { ClienteSchema } from "@/lib/validation/clienteSchema";
import { CrearCliente } from "./CrearCliente";

const OPCIONES = [
  { id: "cartera", label: "Cartera de clientes", titulo: "Cartera de clientes", Icon: UsersIcon },
  { id: "crear", label: "Crear cliente", titulo: "Crear cliente", Icon: UserPlusIcon },
] as const;

type VistaId = (typeof OPCIONES)[number]["id"];

const pesos = (n: number) => `$ ${new Intl.NumberFormat("es-AR").format(n)}`;

const ESTADO_CLASS: Record<EstadoCliente, string> = {
  Activo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "En mora": "bg-red-50 text-red-700 ring-red-200",
  Cancelado: "bg-slate-100 text-slate-600 ring-slate-200",
  Inactivo: "bg-amber-50 text-amber-700 ring-amber-200",
};

function Estado({ estado }: { estado: EstadoCliente }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${ESTADO_CLASS[estado]}`}>
      {estado}
    </span>
  );
}

function Iniciales({ cliente, className }: { cliente: ClienteMock; className: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-mid font-bold text-white ${className}`}
    >
      {cliente.nombre.charAt(0)}
      {cliente.apellido.charAt(0)}
    </span>
  );
}

function Lista({ filas }: { filas: [string, string][] }) {
  return (
    <dl className="divide-y divide-brand-border">
      {filas.map(([label, valor]) => (
        <div key={label} className="flex justify-between gap-3 py-1.5 text-sm">
          <dt className="shrink-0 text-slate-500">{label}</dt>
          <dd className="break-words text-right font-medium text-slate-900">{valor || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Información del cliente elegido: una card por tema, debajo de las opciones. */
function InfoCliente({ cliente }: { cliente: ClienteMock }) {
  const { contrato } = cliente;
  return (
    <>
      <CardLateral titulo="Datos personales">
        <div className="mb-3 flex items-center gap-3">
          <Iniciales cliente={cliente} className="h-10 w-10 text-sm" />
          <div className="min-w-0">
            <p className="font-semibold leading-tight text-slate-900">
              {cliente.nombre} {cliente.apellido}
            </p>
            <div className="mt-1">
              <Estado estado={cliente.estado} />
            </div>
          </div>
        </div>
        <Lista
          filas={[
            ["DNI", cliente.dni],
            ["Email", cliente.email],
            ["Teléfono", cliente.telefono],
            ["Dirección", cliente.direccion],
            ["Cód. postal", cliente.codigoPostal],
            ["Referencias", cliente.referencias],
          ]}
        />
      </CardLateral>

      {contrato && (
        <CardLateral titulo="Contrato de mutuo y pagaré">
          <Lista
            filas={[
              ["Prestado", pesos(contrato.montoPrestado)],
              ["A devolver", pesos(contrato.montoADevolver)],
              ["Cuotas", `${contrato.cantidadCuotas} (${contrato.periodicidad.toLowerCase()})`],
              ["Importe por cuota", pesos(contrato.importeCuota)],
              ["Fecha del contrato", contrato.fechaContrato],
              ["Primera cuota", contrato.fechaPrimeraCuota],
              ["Venc. del pagaré", contrato.fechaVencimientoPagare],
            ]}
          />
        </CardLateral>
      )}

      {!contrato && (
        <CardLateral titulo="Contrato">
          <p className="text-sm text-slate-500">Todavía no tiene contrato.</p>
        </CardLateral>
      )}
    </>
  );
}

/** Cartera de clientes con datos de prueba (en memoria): alta y lista, con la información en cards a la derecha. */
export function CarteraClientes() {
  const [clientes, setClientes] = useState<ClienteMock[]>(CLIENTES_MOCK);
  const [vista, setVista] = useState<VistaId>("cartera");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionId, setSeleccionId] = useState<string | null>(null);

  const actual = OPCIONES.find((o) => o.id === vista) ?? OPCIONES[0];
  const seleccionado = clientes.find((c) => c.id === seleccionId) ?? null;
  const q = busqueda.trim().toLowerCase();
  const filtrados = clientes.filter(
    (c) =>
      !q ||
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
      c.dni.includes(q) ||
      c.email.toLowerCase().includes(q),
  );

  function crear(datos: ClienteSchema) {
    const nuevo: ClienteMock = {
      id: `c-${Date.now()}`,
      estado: "Activo",
      ...datos,
    };
    setClientes((prev) => [...prev, nuevo]);
    setSeleccionId(nuevo.id);
    setBusqueda("");
    setVista("cartera");
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <PanelOpciones titulo="Clientes" opciones={OPCIONES} seleccion={vista} onSelect={setVista} fija={false}>
        {vista === "cartera" &&
          (seleccionado ? (
            <InfoCliente cliente={seleccionado} />
          ) : (
            <CardLateral titulo="Información del cliente">
              <p className="text-sm text-slate-500">Elegí un cliente de la lista para ver su información.</p>
            </CardLateral>
          ))}
      </PanelOpciones>

      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold text-brand">{actual.titulo}</h1>

        <p className="mb-6 rounded-xl border border-dashed border-brand-border bg-white px-4 py-3 text-sm text-slate-600">
          Vista de ejemplo con datos de prueba: los clientes que cargues se guardan solo mientras la página esté
          abierta.
        </p>

        {vista === "crear" ? (
          <CrearCliente onCrear={crear} />
        ) : (
          <section className="overflow-hidden rounded-lg border border-brand-border bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-brand-border p-4">
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, DNI o email"
                aria-label="Buscar cliente"
                className="w-full max-w-sm rounded-md border border-brand-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none"
              />
              <span className="text-sm text-slate-500">
                {filtrados.length} {filtrados.length === 1 ? "cliente" : "clientes"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-brand-soft text-xs uppercase tracking-wide text-brand">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">DNI</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Préstamos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filtrados.map((c) => {
                    const activo = c.id === seleccionId;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSeleccionId(c.id)}
                        aria-selected={activo}
                        className={`cursor-pointer ${activo ? "bg-brand-mid/10" : "hover:bg-brand-soft/60"}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Iniciales cliente={c} className="h-9 w-9 text-sm" />
                            <div>
                              <p className="font-semibold text-slate-900">
                                {c.nombre} {c.apellido}
                              </p>
                              <p className="text-xs text-slate-500">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-800">{c.dni}</td>
                        <td className="px-4 py-3">
                          <Estado estado={c.estado} />
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{c.contrato ? 1 : 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtrados.length === 0 && (
                <div className="flex flex-col items-center gap-2 p-10 text-sm text-slate-500">
                  <UsersIcon className="h-6 w-6" />
                  No hay clientes que coincidan con la búsqueda.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
