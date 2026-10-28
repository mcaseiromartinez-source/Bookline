import type { Clinic as ClinicConfig } from "@/agent/clinic";
import { createAppointment } from "@/lib/db/repo";
import { isEnabled } from "@/lib/integrations";
import type { Interval, SchedulingBackend } from "@/lib/scheduling/backend";
import { addLocalDays, dateKey, localParts, spokenDate, spokenDateTime, zonedTime } from "@/lib/time";

/**
 * AGENTE DE AGENDA
 * Lo usa Lucía DURANTE la llamada (a través de las herramientas de Vapi):
 *  - consultar_huecos: busca huecos libres según el horario de la clínica.
 *  - reservar_cita:    comprueba que el hueco sigue libre, crea la cita en el
 *                      programa de la clínica y la guarda en la base de datos.
 */

const MIN_NOTICE_MINUTES = 60; // no ofrecer huecos que empiezan en menos de 1 hora
const SEARCH_DAYS = 14;
const MAX_SLOTS = 4;

const WEEKDAY_NAMES: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
};

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

type LocalDay = { year: number; month: number; day: number };

/** Interpreta "hoy", "mañana", "pasado mañana", "jueves", "2026-10-30" o "30/10". */
export function resolveDay(input: string | undefined, now: Date, tz: string): LocalDay | null {
  const today = localParts(now, tz);
  if (!input?.trim()) return null;
  const text = normalize(input);

  if (text === "hoy") return today;
  if (text === "manana") return addLocalDays(today.year, today.month, today.day, 1);
  if (text === "pasado manana") return addLocalDays(today.year, today.month, today.day, 2);

  const weekday = Object.entries(WEEKDAY_NAMES).find(([name]) => text.includes(name))?.[1];
  if (weekday !== undefined) {
    const ahead = (weekday - today.weekday + 7) % 7;
    return addLocalDays(today.year, today.month, today.day, ahead);
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { year: +iso[1], month: +iso[2], day: +iso[3] };

  const dm = text.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (dm) {
    const candidate = { year: today.year, month: +dm[2], day: +dm[1] };
    const isPast = Date.UTC(candidate.year, candidate.month - 1, candidate.day) < Date.UTC(today.year, today.month - 1, today.day);
    return isPast ? { ...candidate, year: today.year + 1 } : candidate;
  }
  return null;
}

export type Franja = "mañana" | "tarde" | "cualquiera";

export interface Slot {
  start: Date;
  end: Date;
}

/** Todos los huecos posibles de un día según el horario (sin mirar la agenda). */
function daySlots(day: LocalDay, clinic: ClinicConfig, durationMin: number, franja: Franja): Slot[] {
  const weekday = new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
  const ranges = clinic.schedule[weekday] ?? [];
  const slots: Slot[] = [];
  for (const [open, close] of ranges) {
    for (let m = toMinutes(open); m + durationMin <= toMinutes(close); m += clinic.slotMinutes) {
      if (franja === "mañana" && m >= 14 * 60) continue;
      if (franja === "tarde" && m < 14 * 60) continue;
      const start = zonedTime(day.year, day.month, day.day, Math.floor(m / 60), m % 60, clinic.timezone);
      slots.push({ start, end: new Date(start.getTime() + durationMin * 60_000) });
    }
  }
  return slots;
}

export interface FindSlotsInput {
  dia?: string;
  franja?: Franja;
  duracionMin?: number;
}

export async function findFreeSlots(
  input: FindSlotsInput,
  clinic: ClinicConfig,
  backend: SchedulingBackend,
  now = new Date(),
): Promise<{ slots: Slot[]; requestedDay: LocalDay | null }> {
  const tz = clinic.timezone;
  const duration = input.duracionMin ?? clinic.slotMinutes;
  const franja = input.franja ?? "cualquiera";
  const requestedDay = resolveDay(input.dia, now, tz);
  const start = requestedDay ?? localParts(now, tz);
  const days = requestedDay ? 1 : SEARCH_DAYS;

  const firstDay = zonedTime(start.year, start.month, start.day, 0, 0, tz);
  const lastDayParts = addLocalDays(start.year, start.month, start.day, days);
  const lastDay = zonedTime(lastDayParts.year, lastDayParts.month, lastDayParts.day, 0, 0, tz);
  const busy = await backend.busy(firstDay, lastDay);
  const earliest = new Date(now.getTime() + MIN_NOTICE_MINUTES * 60_000);

  const free: Slot[] = [];
  for (let i = 0; i < days && free.length < MAX_SLOTS; i++) {
    const day = addLocalDays(start.year, start.month, start.day, i);
    for (const slot of daySlots(day, clinic, duration, franja)) {
      if (slot.start < earliest || busy.some((b) => overlaps(slot, b))) continue;
      free.push(slot);
      if (free.length >= MAX_SLOTS) break;
    }
  }
  return { slots: free, requestedDay };
}

/** Texto que lee Lucía con los huecos encontrados. */
export function describeSlots(result: Awaited<ReturnType<typeof findFreeSlots>>, clinic: ClinicConfig, now = new Date()): string {
  const today = `Hoy es ${spokenDate(now, clinic.timezone)}.`;
  if (!result.slots.length) {
    const when = result.requestedDay
      ? `el ${spokenDate(zonedTime(result.requestedDay.year, result.requestedDay.month, result.requestedDay.day, 12, 0, clinic.timezone), clinic.timezone)}`
      : "en los próximos días";
    return `${today} No hay huecos libres ${when} en esa franja. Ofrece otro día u otra franja.`;
  }
  const list = result.slots.map((s) => `- ${spokenDateTime(s.start, clinic.timezone)} (inicio: ${s.start.toISOString()})`).join("\n");
  return `${today} Huecos libres:\n${list}\nOfrece como mucho dos opciones al paciente, de forma natural. Para reservar usa el "inicio" exacto.`;
}

export interface BookInput {
  inicio: string;
  nombre: string;
  telefono: string;
  motivo?: string;
  pacienteNuevo?: boolean;
  urgente?: boolean;
  duracionMin?: number;
}

export interface BookContext {
  clinic: ClinicConfig;
  clinicId: string | null;
  backend: SchedulingBackend;
  vapiCallId: string | null;
}

export async function bookAppointment(input: BookInput, ctx: BookContext, now = new Date()): Promise<string> {
  const { clinic, backend } = ctx;
  const start = new Date(input.inicio);
  if (Number.isNaN(start.getTime())) return "La fecha de inicio no es válida. Vuelve a consultar los huecos.";
  const end = new Date(start.getTime() + (input.duracionMin ?? clinic.slotMinutes) * 60_000);

  if (start.getTime() < now.getTime() + MIN_NOTICE_MINUTES * 60_000) {
    return "Ese hueco ya no está disponible porque empieza muy pronto. Ofrece otro.";
  }

  // ¿Encaja en el horario de la clínica?
  const parts = localParts(start, clinic.timezone);
  const valid = daySlots(parts, clinic, input.duracionMin ?? clinic.slotMinutes, "cualquiera").some(
    (s) => s.start.getTime() === start.getTime(),
  );
  if (!valid) return "Esa hora está fuera del horario de la clínica. Vuelve a consultar los huecos.";

  // ¿Sigue libre? (otra persona podría haberlo cogido mientras hablabais)
  const busy = await backend.busy(start, end);
  if (busy.some((b) => overlaps({ start, end }, b))) {
    return "Ese hueco se acaba de ocupar. Discúlpate con naturalidad y ofrece otro.";
  }

  const name = input.nombre.trim();
  const phone = input.telefono.replace(/[^\d+]/g, "");
  const tags = [input.urgente ? "URGENTE" : null, input.pacienteNuevo ? "Paciente nuevo" : null].filter(Boolean).join(" · ");
  const eventId = await backend.createEvent({
    start,
    end,
    timezone: clinic.timezone,
    title: `${input.urgente ? "🔴 " : ""}${name}${input.motivo ? ` · ${input.motivo}` : ""}`,
    description: [`Reservada por la asistente virtual (Atendo).`, `Teléfono: ${phone}`, input.motivo ? `Motivo: ${input.motivo}` : null, tags || null]
      .filter(Boolean)
      .join("\n"),
  });

  if (ctx.clinicId && isEnabled("supabase")) {
    await createAppointment({
      clinicId: ctx.clinicId,
      vapiCallId: ctx.vapiCallId,
      patientName: name,
      patientPhone: phone,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      reason: input.motivo ?? null,
      isNewPatient: input.pacienteNuevo ?? null,
      urgent: input.urgente ?? false,
      calendarEventId: eventId,
      remindersEnabled: true,
    }).catch((err) => console.error("[agenda] cita creada en el calendario pero no guardada en la base de datos:", err));
  }

  return `Cita reservada para ${name} el ${spokenDateTime(start, clinic.timezone)} (${dateKey(start, clinic.timezone)}). Confírmaselo al paciente y dile que recibirá un recordatorio el día antes.`;
}
