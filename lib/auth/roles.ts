/** Roles de la app. Tienen que coincidir con el enum `app_role` de supabase/schema.sql. */
export const ROLES = ["admin", "operador", "lectura"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  operador: "Operador",
  lectura: "Solo lectura",
};

export type Permission = "documentos:leer" | "documentos:crear" | "usuarios:gestionar";

const PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: ["documentos:leer", "documentos:crear", "usuarios:gestionar"],
  operador: ["documentos:leer", "documentos:crear"],
  lectura: ["documentos:leer"],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Qué puede hacer cada rol. La base de datos aplica las mismas reglas con RLS. */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && PERMISSIONS[role].includes(permission);
}
