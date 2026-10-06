import { z } from "zod";
import { parseMontoAR } from "@/lib/format/montoAR";

const monto = z.preprocess(
  parseMontoAR,
  z.number({ error: "Ingresá un monto válido" }).positive("Debe ser mayor a 0")
);

export const contratoDatosSchema = z.object({
  mutuarioNombre: z.string().min(1, "Requerido"),
  mutuarioDni: z.string().min(1, "Requerido"),
  mutuarioDomicilio: z.string().min(1, "Requerido"),
  mutuarioEmail: z.string().email("Email inválido"),

  montoPrestado: monto,
  montoADevolver: monto,
  cantidadCuotas: z.coerce.number().int().min(1, "Requerido"),
  importeCuota: monto,
  periodicidadPago: z.enum(["mensual", "quincenal", "semanal"]),
  fechaPrimeraCuota: z.string().min(1, "Requerido"),
  diasHabilesPago: z.coerce.number().int().min(1, "Requerido"),

  fechaContrato: z.string().min(1, "Requerido"),
  fechaVencimientoPagare: z.string().min(1, "Requerido"),

  garanteNombre: z.string(),
  garanteDni: z.string(),
});

export type ContratoDatosSchema = z.infer<typeof contratoDatosSchema>;
