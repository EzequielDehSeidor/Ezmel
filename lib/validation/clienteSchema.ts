import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido"),
  apellido: z.string().trim().min(1, "Requerido"),
  dni: z.string().trim().min(1, "Requerido"),
  email: z.string().trim().email("Email inválido"),
  telefono: z.string().trim(),
  direccion: z.string().trim(),
  codigoPostal: z.string().trim(),
  referencias: z.string().trim(),
});

export type ClienteSchema = z.infer<typeof clienteSchema>;
