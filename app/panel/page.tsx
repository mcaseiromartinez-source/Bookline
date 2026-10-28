import { AlertTriangle, ChevronRight, Clock, Inbox, PhoneIncoming, Star } from "lucide-react";
import Link from "next/link";
import { getStats, listCalls, type CallFilter } from "@/lib/panel/data";
import { duration, timeAgo, TIPO_LABEL, URGENCIA_STYLE } from "@/lib/panel/format";

const FILTERS: { id: CallFilter; label: string }[] = [
  { id: "pendientes", label: "Pendientes" },
  { id: "urgentes", label: "Urgentes" },
  { id: "todas", label: "Todas" },
];

export default async function PanelPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro } = await searchParams;
  const filter: CallFilter = FILTERS.some((f) => f.id === filtro) ? (filtro as CallFilter) : "pendientes";
  const [calls, stats] = await Promise.all([listCalls(filter), getStats()]);

  const cards = [
    { label: "Llamadas hoy", value: stats.today, icon: PhoneIncoming, tone: "text-cyan-300" },
    { label: "Pendientes", value: stats.pending, icon: Clock, tone: "text-amber-200" },
    { label: "Urgentes", value: stats.urgent, icon: AlertTriangle, tone: "text-rose-300" },
    { label: "Calidad media", value: stats.quality === null ? "—" : `${stats.quality}/10`, icon: Star, tone: "text-emerald-300" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Llamadas</h1>
      <p className="mt-1 text-sm text-slate-400">Lo que ha atendido tu asistente mientras estabais con pacientes.</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-white/5 bg-ink-900 p-4">
            <dt className="flex items-center gap-1.5 text-xs text-slate-400">
              <Icon className={`size-3.5 ${tone}`} /> {label}
            </dt>
            <dd className="font-display mt-1 text-2xl font-bold text-white">{value}</dd>
          </div>
        ))}
      </dl>

      <nav className="mt-8 flex gap-1 rounded-xl border border-white/5 bg-ink-900 p-1 sm:w-fit" aria-label="Filtrar llamadas">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={`/panel?filtro=${f.id}`}
            aria-current={f.id === filter ? "page" : undefined}
            className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition sm:flex-none ${
              f.id === filter ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {calls.length === 0 ? (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <Inbox className="size-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">
            {filter === "todas" ? "Todavía no hay llamadas." : "Nada pendiente por aquí. ¡Buen trabajo!"}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {calls.map((call) => {
            const s = call.summary;
            const urg = URGENCIA_STYLE[s?.urgencia ?? "baja"];
            return (
              <li key={call.id}>
                <Link
                  href={`/panel/llamadas/${call.id}`}
                  className={`group flex items-center gap-4 rounded-2xl border bg-ink-900 p-4 transition hover:border-white/15 hover:bg-ink-850 ${
                    call.handledAt ? "border-white/5 opacity-60" : "border-white/10"
                  }`}
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${urg.dot}`} aria-label={urg.label} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-white">{s?.pacienteNombre ?? call.callerNumber ?? "Número oculto"}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${urg.badge}`}>
                        {s ? TIPO_LABEL[s.tipo] : "Sin resumen"}
                      </span>
                      {call.handledAt && <span className="text-[11px] text-emerald-400">✓ Gestionada</span>}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-300">{s?.accionRequerida ?? "Resumen pendiente"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {timeAgo(call.createdAt)} · {duration(call.durationSeconds)} min
                      {s?.motivo ? ` · ${s.motivo}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
