import { ArrowLeft, Bot, CheckCircle2, Phone, RotateCcw, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCall } from "@/lib/panel/data";
import { duration, fullDate, parseTranscript, TIPO_LABEL, URGENCIA_STYLE } from "@/lib/panel/format";
import { toggleHandled } from "../../actions";

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const call = await getCall(id);
  if (!call) notFound();

  const s = call.summary;
  const q = call.quality;
  const urg = URGENCIA_STYLE[s?.urgencia ?? "baja"];
  const phone = s?.telefonoContacto ?? call.callerNumber;
  const turns = parseTranscript(call.transcript);

  return (
    <div className="space-y-6">
      <Link href="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="size-4" /> Volver
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${urg.badge}`}>{urg.label}</span>
            <span className="text-xs text-slate-500">{s ? TIPO_LABEL[s.tipo] : "Sin resumen"}</span>
          </div>
          <h1 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
            {s?.pacienteNombre ?? phone ?? "Número oculto"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {fullDate(call.createdAt)} · {duration(call.durationSeconds)} min
          </p>
        </div>
        <form action={toggleHandled}>
          <input type="hidden" name="id" value={call.id} />
          <input type="hidden" name="handled" value={call.handledAt ? "false" : "true"} />
          {call.handledAt ? (
            <button className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-300 hover:bg-white/5 sm:w-auto">
              <RotateCcw className="size-4" /> Marcar como pendiente
            </button>
          ) : (
            <button className="flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:brightness-110 sm:w-auto">
              <CheckCircle2 className="size-4" /> Marcar como gestionada
            </button>
          )}
        </form>
      </header>

      {s && (
        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
          <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">Qué hay que hacer</p>
          <p className="mt-1 text-lg font-semibold text-white">{s.accionRequerida}</p>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              <Phone className="size-4" /> Llamar al {phone}
            </a>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          {s && (
            <section className="rounded-2xl border border-white/5 bg-ink-900 p-5">
              <h2 className="font-display font-bold text-white">Resumen</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ["Paciente", `${s.pacienteNombre ?? "Sin nombre"}${s.pacienteNuevo === true ? " (nuevo)" : s.pacienteNuevo === false ? " (ya es paciente)" : ""}`],
                  ["Teléfono", phone ?? "No disponible"],
                  ["Motivo", s.motivo],
                  ["Prefiere", s.preferenciaHoraria],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-20 shrink-0 text-slate-500">{k}</dt>
                      <dd className="text-slate-200">{v}</dd>
                    </div>
                  ))}
              </dl>
              <p className="mt-4 border-t border-white/5 pt-4 text-sm text-slate-300 italic">{s.resumen}</p>
              {s.pendientes.length > 0 && (
                <div className="mt-4 rounded-xl bg-amber-400/10 p-3">
                  <p className="text-xs font-semibold text-amber-200">Pendiente de aclarar</p>
                  <ul className="mt-1 list-disc pl-4 text-sm text-amber-100/90">
                    {s.pendientes.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {call.recordingUrl && (
            <section className="rounded-2xl border border-white/5 bg-ink-900 p-5">
              <h2 className="font-display mb-3 font-bold text-white">Grabación</h2>
              <audio controls preload="none" src={call.recordingUrl} className="w-full" />
            </section>
          )}

          {q && (
            <section className="rounded-2xl border border-white/5 bg-ink-900 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-white">Calidad de la llamada</h2>
                <span className={`font-display text-xl font-bold ${q.puntuacion >= 8 ? "text-emerald-300" : q.puntuacion >= 6 ? "text-amber-200" : "text-rose-300"}`}>
                  {q.puntuacion}/10
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{q.resumen}</p>
              {q.errores.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {q.errores.map((e, i) => (
                    <li key={i} className={`rounded-lg p-3 text-sm ${e.gravedad === "grave" ? "bg-rose-500/10 text-rose-100" : "bg-white/5 text-slate-300"}`}>
                      <span className="font-semibold">{e.gravedad === "grave" ? "Grave" : "Leve"}:</span> {e.explicacion}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <section className="rounded-2xl border border-white/5 bg-ink-900 p-5">
          <h2 className="font-display font-bold text-white">Conversación</h2>
          {turns.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Sin transcripción.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {turns.map((t, i) => (
                <li key={i} className={`flex items-end gap-2 ${t.speaker === "ai" ? "" : "flex-row-reverse"}`}>
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full ${
                      t.speaker === "ai" ? "bg-cyan-400/15 text-cyan-300" : "bg-white/10 text-slate-300"
                    }`}
                    aria-label={t.speaker === "ai" ? "Asistente" : "Paciente"}
                  >
                    {t.speaker === "ai" ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                  </span>
                  <p
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      t.speaker === "ai" ? "rounded-bl-sm bg-cyan-500/10 text-cyan-50 ring-1 ring-cyan-400/15" : "rounded-br-sm bg-white/[0.07] text-slate-200"
                    }`}
                  >
                    {t.text}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
