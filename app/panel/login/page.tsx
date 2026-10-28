import { isDemoMode } from "@/lib/panel/data";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl shadow-black/40 sm:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-600">
            <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" aria-hidden="true">
              <path d="M5 10v4M9 7v10M13 4v16M17 8v8M21 11v2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-display text-xl font-bold text-white">Atendo</span>
        </div>
        <h1 className="font-display text-xl font-bold text-white">Panel de la clínica</h1>
        <p className="mt-1 text-sm text-slate-400">Entra para ver las llamadas que ha atendido tu asistente.</p>
        <LoginForm demo={isDemoMode()} />
      </div>
    </div>
  );
}
