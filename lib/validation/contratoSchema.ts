import { z } from "zod";

export const contratoDatosSchema = z.object({
  mutuarioNombre: z.string().min(1, "Requerido"),
  mutuarioDni: z.string().min(1, "Requerido"),
  mutuarioDomicilio: z.string().min(1, "Requerido"),
  mutuarioEmail: z.string().email("Email inválido"),

  montoPrestado: z.coerce.number().min(1, "Requerido"),
  montoADevolver: z.coerce.number().min(1, "Requerido"),
  cantidadCuotas: z.coerce.number().int().min(1, "Requerido"),
  importeCuota: z.coerce.number().min(1, "Requerido"),
  periodicidadPago: z.enum(["mensual", "quincenal", "semanal"]),
  fechaPrimeraCuota: z.string().min(1, "Requerido"),
  diasHabilesPago: z.coerce.number().int().min(1, "Requerido"),

  fechaContrato: z.string().min(1, "Requerido"),
  fechaVencimientoPagare: z.string().min(1, "Requerido"),

  garanteNombre: z.string(),
  garanteDni: z.string(),
});

export type ContratoDatosSchema = z.infer<typeof contratoDatosSchema>;
