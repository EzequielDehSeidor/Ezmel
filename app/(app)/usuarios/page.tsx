import { requirePageAccess } from "@/lib/auth/guards";
import { SeccionVacia } from "@/components/layout/SeccionVacia";

export default async function UsuariosPage() {
  // Solo administradores: se verifica acá (el layout no se vuelve a ejecutar al navegar).
  await requirePageAccess("usuarios:gestionar");
  return <SeccionVacia titulo="Usuarios y permisos" />;
}
