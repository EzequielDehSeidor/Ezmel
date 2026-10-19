import { z } from "zod";

export const refinanciacionSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  apellido: z.string().trim().min(1, "Requerido"),
  fechaRefinanciacion: z.string().min(1, "Requerido"),
});

export type RefinanciacionSchema = z.infer<typeof refinanciacionSchema>;
