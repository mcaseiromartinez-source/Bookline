import { CALENDAR_SCOPE, googleFetch } from "@/lib/google";
import type { Interval, NewEvent, SchedulingBackend } from "./backend";

const API = "https://www.googleapis.com/calendar/v3";

/**
 * Agenda en Google Calendar.
 * La clínica comparte su calendario con el email de la cuenta de servicio
 * con permiso "Hacer cambios en eventos".
 */
export class GoogleCalendarBackend implements SchedulingBackend {
  readonly name = "Google Calendar";

  constructor(private readonly calendarId: string) {}

  async busy(from: Date, to: Date): Promise<Interval[]> {
    const res = await googleFetch<{
      calendars: Record<string, { busy?: { start: string; end: string }[]; errors?: { reason: string }[] }>;
    }>(`${API}/freeBusy`, CALENDAR_SCOPE, {
      method: "POST",
      body: { timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: this.calendarId }] },
    });
    const cal = res.calendars[this.calendarId];
    if (cal?.errors?.length) {
      throw new Error(`No puedo leer el calendario (${cal.errors.map((e) => e.reason).join(", ")}). ¿Está compartido con la cuenta de servicio?`);
    }
    return (cal?.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
  }

  async createEvent(event: NewEvent): Promise<string> {
    const created = await googleFetch<{ id: string }>(
      `${API}/calendars/${encodeURIComponent(this.calendarId)}/events`,
      CALENDAR_SCOPE,
      {
        method: "POST",
        body: {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.start.toISOString(), timeZone: event.timezone },
          end: { dateTime: event.end.toISOString(), timeZone: event.timezone },
        },
      },
    );
    return created.id;
  }
}
