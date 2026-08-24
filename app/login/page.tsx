import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { isMockMode } from "@/lib/supabase/env";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-wide text-brand">EZMEL</h1>
          <p className="mt-1 text-sm text-slate-600">Acceso administrador</p>
        </div>

        {isMockMode() && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Modo demo: Supabase no está configurado todavía. Cualquier email/contraseña
            inicia sesión localmente. Ver <code>README.md</code> para conectar Supabase.
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
