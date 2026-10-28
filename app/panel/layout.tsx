import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getViewer, isDemoMode } from "@/lib/panel/data";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Panel · Atendo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const demo = isDemoMode();

  return (
    <div className="min-h-screen bg-ink-950">
      {demo && (
        <div className="bg-amber-400/10 px-4 py-2 text-center text-xs text-amber-200 sm:text-sm">
          Modo demostración: datos de ejemplo. Conecta Supabase para ver las llamadas reales.
        </div>
      )}
      {viewer && (
        <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/panel" className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-linear-to-br from-cyan-400 to-blue-600">
                <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" aria-hidden="true">
                  <path d="M5 10v4M9 7v10M13 4v16M17 8v8M21 11v2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="font-display block text-sm font-bold text-white">Atendo</span>
                <span className="block truncate text-xs text-slate-400">{viewer.clinicName}</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-500 sm:block">{viewer.email}</span>
              <form action={signOut}>
                <button
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
