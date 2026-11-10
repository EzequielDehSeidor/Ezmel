"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoutIcon } from "@/components/layout/icons";

export function LogoutButton({ variant = "icon" }: { variant?: "icon" | "text" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-hover disabled:opacity-60"
      >
        {loading ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className="rounded-xl p-2 text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-60"
    >
      <LogoutIcon />
    </button>
  );
}
