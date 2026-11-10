import { redirect } from "next/navigation";
import { can, ROLE_LABEL } from "@/lib/auth/roles";
import { getServerSession, hasAccess } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  // Cuenta creada pero sin tenant/rol (todavía no la invitaron) o desactivada.
  if (!hasAccess(session)) {
    redirect("/sin-acceso");
  }

  return (
    <AppShell
      email={session.email}
      userName={session.name}
      roleLabel={ROLE_LABEL[session.role]}
      tenantName={session.tenant.name}
      readOnly={!can(session.role, "documentos:crear")}
      canManageUsers={can(session.role, "usuarios:gestionar")}
    >
      {children}
    </AppShell>
  );
}
