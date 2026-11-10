"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import {
  CalculatorIcon,
  CalendarCheckIcon,
  CashIcon,
  ChartIcon,
  CloseIcon,
  FileTextIcon,
  FolderIcon,
  HistoryIcon,
  MenuIcon,
  ShieldIcon,
  TimelineIcon,
  UsersIcon,
} from "./icons";

// Para sumar una sección nueva, agregá una entrada acá y su página en app/(app)/<ruta>.
type IconType = (props: { className?: string }) => ReactNode;
type NavItem = { href: string; label: string; Icon: IconType };

const SECTIONS: NavItem[] = [
  { href: "/legajos", label: "Legajos", Icon: FolderIcon },
  { href: "/contratos", label: "Contratos", Icon: FileTextIcon },
];

// Mejoras propuestas: las pantallas están vacías hasta que se definan.
const PROPUESTAS = [
  { href: "/historial-documentos", label: "Historial de documentos", Icon: HistoryIcon },
  { href: "/clientes", label: "Cartera de clientes", Icon: UsersIcon },
  { href: "/historial-cliente", label: "Historial del cliente", Icon: TimelineIcon },
  { href: "/cotizador", label: "Cotizador de interés", Icon: CalculatorIcon },
  { href: "/prestamos", label: "Préstamos y cuotas", Icon: CashIcon },
  { href: "/cobranzas", label: "Cobranzas y vencimientos", Icon: CalendarCheckIcon },
  { href: "/reportes", label: "Tablero y reportes", Icon: ChartIcon },
  { href: "/usuarios", label: "Usuarios y permisos", Icon: ShieldIcon },
];

interface AppShellProps {
  email: string;
  userName: string | null;
  roleLabel: string;
  tenantName: string;
  /** Rol sin permiso para crear documentos (solo lectura). */
  readOnly: boolean;
  canManageUsers: boolean;
  children: ReactNode;
}

export function AppShell({ email, userName, roleLabel, tenantName, readOnly, canManageUsers, children }: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const anchoCompleto = ["/contratos", "/legajos", "/clientes"].includes(pathname); // el panel de tipos queda pegado al borde derecho
  const initial = ((userName ?? email).trim().charAt(0) || "A").toUpperCase();
  // La pantalla de usuarios es solo para administradores (igual se verifica en el servidor).
  const propuestas = PROPUESTAS.filter((p) => p.href !== "/usuarios" || canManageUsers);

  function navLink(href: string, label: string, Icon: IconType, tenue = false) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    const inactiveColor = tenue ? "text-white/65" : "text-white/80";
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMenuOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          active ? "bg-white/15 text-white" : `${inactiveColor} hover:bg-white/10 hover:text-white`
        }`}
      >
        <Icon className={`h-5 w-5 ${active ? "text-[#6ACEC6]" : ""}`} />
        {label}
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-brand-mid md:h-screen md:overflow-hidden md:p-3">
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <Image src="/logo-white.png" alt="EzMel" width={1200} height={262} priority unoptimized className="h-7 w-auto" />
        <button
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded-xl p-2 text-white hover:bg-white/15"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div className="md:flex md:h-full md:gap-3">
        <aside
          className={`${menuOpen ? "flex" : "hidden"} shrink-0 flex-col px-4 pb-4 text-white md:flex md:h-full md:w-52 md:p-3`}
        >
          <div className="hidden px-2 pb-8 pt-2 md:block">
            <Image src="/logo-tagline-white.png" alt="EzMel, servicios financieros" width={1200} height={436} priority unoptimized className="h-auto w-36" />
          </div>

          <nav
            aria-label="Secciones"
            className="flex-1 space-y-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.3)_transparent] [scrollbar-width:thin]"
          >
            {SECTIONS.map(({ href, label, Icon }) => navLink(href, label, Icon))}

            <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-white/60">En definición</p>
            {propuestas.map(({ href, label, Icon }) => navLink(href, label, Icon, true))}
          </nav>

          <div className="mt-4 flex items-center gap-3 border-t border-white/20 px-1 pt-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6ACEC6] text-sm font-bold text-[#0f3f4d]">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight" title={`${roleLabel} · ${tenantName}`}>
                {roleLabel} · {tenantName}
              </p>
              <p className="truncate text-xs text-white/75" title={email}>
                {userName ?? email}
              </p>
            </div>
            <LogoutButton />
          </div>
        </aside>

        <main className={`min-w-0 flex-1 rounded-t-3xl bg-slate-50 px-4 py-6 [scrollbar-color:#a9cbcd_transparent] [scrollbar-width:thin] md:h-full md:overflow-y-auto md:rounded-3xl ${anchoCompleto ? "md:pl-8 md:pr-4" : "md:px-8"} md:py-8`}>
          {readOnly && (
            <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Tu rol es de solo lectura: podés consultar, pero no generar ni descargar documentos nuevos.
            </p>
          )}
          <div className={anchoCompleto ? "" : "mx-auto max-w-5xl"}>{children}</div>
        </main>
      </div>
    </div>
  );
}
