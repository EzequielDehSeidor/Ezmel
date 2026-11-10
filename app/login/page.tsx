import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { isMockMode } from "@/lib/supabase/env";
import { LoginForm } from "@/components/auth/LoginForm";

const ERROR_MESSAGES: Record<string, string> = {
  auth: "No se pudo completar el inicio de sesión. Probá de nuevo.",
  oauth: "No se pudo iniciar sesión con Google. Probá de nuevo.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const session = await getServerSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a5f6f] to-[#237082] px-4 py-8">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#6ACEC6]/15" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#6ACEC6]/15" />

      <div className="relative w-full max-w-5xl rounded-[2rem] border border-white/25 bg-white/10 p-3 shadow-2xl backdrop-blur-sm">
        <div className="grid overflow-hidden rounded-3xl bg-white md:grid-cols-2">
          <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#237082] to-[#1a5f6f] p-8 text-white md:p-10">
            <div aria-hidden className="pointer-events-none absolute -right-16 top-24 h-48 w-48 rounded-full bg-[#6ACEC6]/15" />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#6ACEC6]/15" />

            <div className="relative">
              <Image src="/logo-tagline-white.png" alt="EzMel, servicios financieros" width={1200} height={436} priority unoptimized className="h-auto w-52" />
              <div aria-hidden className="mt-6 h-1 w-14 rounded-full bg-[#6ACEC6]" />
              <h2 className="mt-6 text-3xl font-bold leading-tight md:text-4xl">
                Gestioná tus legajos y contratos de forma simple
              </h2>
              <p className="mt-3 max-w-sm text-base text-white/90">
                Armá la documentación de tus clientes, generá contratos y pagarés y descargalos en Word, PDF o Excel.
              </p>
            </div>

            <div className="relative mt-8 hidden justify-center md:flex">
              <div className="h-56 w-56 overflow-hidden rounded-3xl bg-white shadow-xl ring-4 ring-[#6ACEC6]/50">
                <Image
                  src="/prestamos.jpg"
                  alt=""
                  width={736}
                  height={736}
                  unoptimized
                  className="h-full w-full scale-110 object-cover"
                />
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center p-8 md:p-12">
            <h1 className="text-3xl font-bold text-[#1a5f6f]">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-slate-600">Ingresá con tu cuenta</p>

            {isMockMode() && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Modo demo: Supabase no está configurado todavía. Cualquier email/contraseña
                inicia sesión localmente. Ver <code>README.md</code> para conectar Supabase.
              </div>
            )}

            <div className="mt-6">
              <LoginForm initialError={(error && ERROR_MESSAGES[error]) || null} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
