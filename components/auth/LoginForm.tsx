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
    <div>
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
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#6ACEC6]/40"
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
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#6ACEC6]/40"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading !== null}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-hover disabled:opacity-60"
        >
          {loading === "password" ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">o</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
      >
        <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
          <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        {loading === "google" ? "Redirigiendo..." : mock ? "Continuar con Google (demo)" : "Continuar con Google"}
      </button>
    </div>
  );
}
