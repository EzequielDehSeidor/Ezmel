import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return <AppShell email={session.email}>{children}</AppShell>;
}
