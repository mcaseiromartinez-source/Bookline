import type { CallSummary } from "@/lib/agents/summary";

export const TIPO_LABEL: Record<CallSummary["tipo"], string> = {
  cita_nueva: "Cita nueva",
  cambio_cita: "Cambio de cita",
  cancelacion: "Cancelación",
  consulta: "Consulta",
  urgencia: "Urgencia",
  otro: "Otro",
};

export const URGENCIA_STYLE: Record<CallSummary["urgencia"], { label: string; dot: string; badge: string }> = {
  alta: { label: "Urgente", dot: "bg-rose-500", badge: "bg-rose-500/15 text-rose-300 ring-rose-500/30" },
  media: { label: "Media", dot: "bg-amber-400", badge: "bg-amber-400/15 text-amber-200 ring-amber-400/30" },
  baja: { label: "Normal", dot: "bg-emerald-400", badge: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/30" },
};

const TZ = "Europe/Madrid";

export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return new Intl.DateTimeFormat("es-ES", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function fullDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { timeZone: TZ, dateStyle: "full", timeStyle: "short" }).format(new Date(iso));
}

export function duration(seconds: number | null): string {
  if (seconds === null) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Separa la transcripción "AI: …/User: …" en turnos. */
export function parseTranscript(text: string): { speaker: "ai" | "caller"; text: string }[] {
  const turns: { speaker: "ai" | "caller"; text: string }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^(AI|Assistant|Bot|User|Customer)\s*:\s*(.*)$/i);
    if (match) {
      turns.push({ speaker: /^(ai|assistant|bot)$/i.test(match[1]) ? "ai" : "caller", text: match[2] });
    } else if (turns.length) {
      turns[turns.length - 1].text += ` ${line}`;
    }
  }
  return turns;
}
