"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const input =
  "w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none";

export function LoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (demo) {
    return (
      <div className="mt-6">
        <p className="rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
          Modo demostración: no hace falta contraseña.
        </p>
        <Link
          href="/panel"
          className="mt-4 flex w-full items-center justify-center rounded-full bg-linear-to-r from-cyan-400 to-blue-500 py-3 font-semibold text-ink-950"
        >
          Entrar al panel de prueba
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }
    router.replace("/panel");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
          Email
        </label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-cyan-400 to-blue-500 py-3 font-semibold text-ink-950 hover:brightness-110 disabled:opacity-70"
      >
        {loading && <Loader2 className="size-4 animate-spin" />} Entrar
      </button>
    </form>
  );
}
