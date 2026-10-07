"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { CloseIcon, FileTextIcon, FolderIcon, MenuIcon } from "./icons";

// Para sumar una sección nueva, agregá una entrada acá y su página en app/(app)/<ruta>.
const SECTIONS = [
  { href: "/legajos", label: "Legajos", Icon: FolderIcon },
  { href: "/contratos", label: "Contratos", Icon: FileTextIcon },
];

export function AppShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (email.trim().charAt(0) || "A").toUpperCase();

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
          className={`${menuOpen ? "flex" : "hidden"} shrink-0 flex-col px-4 pb-4 text-white md:flex md:h-full md:w-60 md:p-3`}
        >
          <div className="hidden px-2 pb-8 pt-2 md:block">
            <Image src="/logo-tagline-white.png" alt="EzMel, servicios financieros" width={1200} height={436} priority unoptimized className="h-auto w-44" />
          </div>

          <nav aria-label="Secciones" className="flex-1 space-y-1">
            {SECTIONS.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-[#6ACEC6]" : ""}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 flex items-center gap-3 border-t border-white/20 px-1 pt-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6ACEC6] text-sm font-bold text-[#0f3f4d]">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Administrador</p>
              <p className="truncate text-xs text-white/75">{email}</p>
            </div>
            <LogoutButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1 rounded-t-3xl bg-slate-50 px-4 py-6 [scrollbar-color:#a9cbcd_transparent] [scrollbar-width:thin] md:h-full md:overflow-y-auto md:rounded-3xl md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
