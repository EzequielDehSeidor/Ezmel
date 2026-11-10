import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession, hasAccess } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/LogoutButton";

/** Cuenta autenticada pero sin tenant/rol (falta la invitación) o desactivada. */
export default async function SinAccesoPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (hasAccess(session)) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a5f6f] to-[#237082] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <Image
          src="/logo-tagline.png"
          alt="EzMel, servicios financieros"
          width={1200}
          height={436}
          priority
          unoptimized
          className="mx-auto h-auto w-44"
        />
        <h1 className="mt-6 text-2xl font-bold text-[#1a5f6f]">Tu cuenta todavía no tiene acceso</h1>
        <p className="mt-3 text-sm text-slate-600">
          Iniciaste sesión como <strong className="text-slate-900">{session.email}</strong>, pero ese email no está
          asociado a ninguna empresa activa.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Pedile a un administrador que te invite con este mismo email. Cuando lo haga, volvé a ingresar.
        </p>
        <div className="mt-6 flex justify-center">
          <LogoutButton variant="text" />
        </div>
      </div>
    </div>
  );
}
