"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isMockMode } from "@/lib/supabase/env";

export function LoginForm() {
  const router = useRouter();
  const mock = isMockMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"password" | "google" | null>(null);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("password");
    try {
      const endpoint = mock ? "/api/auth/mock-login" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, provider: "password" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading("google");
    try {
      if (mock) {
        const res = await fetch("/api/auth/mock-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin.demo@ezmel.local", provider: "google-demo" }),
        });
        if (!res.ok) {
          setError("No se pudo iniciar sesión");
          return;
        }
        router.push("/");
        router.refresh();
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading !== null}
          className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {loading === "password" ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">o</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-brand-border px-3 py-2 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-60"
      >
        {loading === "google" ? "Redirigiendo..." : mock ? "Continuar con Google (demo)" : "Continuar con Google"}
      </button>
    </div>
  );
}
