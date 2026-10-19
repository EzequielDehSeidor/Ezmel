import { z } from "zod";
import { parseMontoAR } from "@/lib/format/montoAR";

const monto = z.preprocess(
  parseMontoAR,
  z.number({ error: "Ingresá un monto válido" }).positive("Debe ser mayor a 0")
);

/** Porcentaje en formato argentino (437,19 · 4.059,16). */
const porcentaje = z.preprocess(
  parseMontoAR,
  z.number({ error: "Ingresá un porcentaje válido" }).positive("Debe ser mayor a 0")
);

export const contratoDatosSchema = z
  .object({
  numeroContrato: z.string().trim().regex(/^\d{1,6}$/, "Ingresá solo números (hasta 6 dígitos)"),

  mutuarioNombre: z.string().min(1, "Requerido"),
  mutuarioDni: z.string().min(1, "Requerido"),
  mutuarioDomicilio: z.string().min(1, "Requerido"),
  mutuarioEmail: z.string().email("Email inválido"),
  mutuarioCbu: z.string().trim(),
  mutuarioAlias: z.string().trim(),

  montoPrestado: monto,
  montoADevolver: monto,
  cantidadCuotas: z.coerce.number().int().min(1, "Requerido"),
  importeCuota: monto,
  periodicidadPago: z.enum(["mensual", "quincenal", "semanal"]),
  fechaPrimeraCuota: z.string().min(1, "Requerido"),

  tna: porcentaje,
  tem: porcentaje,
  tea: porcentaje,
  cftea: porcentaje,

  fechaContrato: z.string().min(1, "Requerido"),
  fechaVencimientoPagare: z.string().min(1, "Requerido"),

  garanteNombre: z.string(),
  garanteDni: z.string(),
  })
  .refine((d) => d.mutuarioCbu !== "" || d.mutuarioAlias !== "", {
    message: "Ingresá el CBU o el alias",
    path: ["mutuarioCbu"],
  });

export type ContratoDatosSchema = z.infer<typeof contratoDatosSchema>;
