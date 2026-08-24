import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold tracking-wide text-white">Ezmel</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
