import { z } from "zod";

const servicioSchema = z.object({
  servicio: z.enum(["Luz", "Gas", "Agua", "Internet", "Telefonía", "Otro"]),
  titular: z.string(),
  fecha: z.string(),
  observaciones: z.string(),
});

const checklistSchema = z.object({
  documentacionCompleta: z.boolean(),
  dniVerificado: z.boolean(),
  haberesVerificados: z.boolean(),
  serviciosVerificados: z.boolean(),
  capturasIncorporadas: z.boolean(),
  legajoCompleto: z.boolean(),
});

/** Paso 1: todos los campos de datos (sin archivos). */
export const legajoDatosSchema = z.object({
  nombreApellido: z.string().min(1, "Requerido"),
  numeroPrestamo: z.string().min(1, "Requerido"),
  dni: z.string().min(1, "Requerido"),
  fechaApertura: z.string().min(1, "Requerido"),

  nombre: z.string().min(1, "Requerido"),
  apellido: z.string().min(1, "Requerido"),
  telefono: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  direccion: z.string(),
  codigoPostal: z.string(),
  referencias: z.string(),

  montoPrestamo: z.coerce.number().min(0),

  servicios: z.array(servicioSchema),

  observacionesGenerales: z.string(),

  checklist: checklistSchema,

  responsable: z.string(),
  fechaResponsable: z.string(),
});

/** Paso 2: observaciones de cada categoría (los File en sí se validan aparte en el cliente). */
export const legajoArchivosObsSchema = z.object({
  dniObs: z.string(),
  haberesObs: z.string(),
  serviciosObs: z.string(),
  transferenciasObs: z.string(),
  capturasVariasObs: z.string(),
});

export const legajoFormSchema = legajoDatosSchema.merge(legajoArchivosObsSchema);

export type LegajoFormSchema = z.infer<typeof legajoFormSchema>;

export const STEP1_FIELDS = [
  "nombreApellido",
  "numeroPrestamo",
  "dni",
  "fechaApertura",
  "nombre",
  "apellido",
  "telefono",
  "email",
  "direccion",
  "codigoPostal",
  "referencias",
  "montoPrestamo",
  "servicios",
  "observacionesGenerales",
] as const;
