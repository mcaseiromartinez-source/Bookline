/**
 * Fechas en la zona horaria de la clínica (por defecto Europe/Madrid),
 * con cambio de hora de verano/invierno, sin librerías externas.
 */

export const DEFAULT_TZ = "Europe/Madrid";

interface Parts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = domingo … 6 = sábado
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function localParts(date: Date, tz = DEFAULT_TZ): Parts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    weekday: WEEKDAYS[p.weekday],
  };
}

function offsetMs(date: Date, tz: string): number {
  const p = localParts(date, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(date.getTime() / 60000) * 60000;
}

/** Convierte una fecha/hora "de reloj" en la zona de la clínica a un instante real (UTC). */
export function zonedTime(year: number, month: number, day: number, hour: number, minute: number, tz = DEFAULT_TZ): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let result = guess - offsetMs(new Date(guess), tz);
  // Segunda pasada por si la primera cruzó un cambio de hora.
  result = guess - offsetMs(new Date(result), tz);
  return new Date(result);
}

/** "2026-10-30" en la zona de la clínica. */
export function dateKey(date: Date, tz = DEFAULT_TZ): string {
  const p = localParts(date, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** "2026-10-30 10:30" en la zona de la clínica (para hojas de cálculo). */
export function dateTimeKey(date: Date, tz = DEFAULT_TZ): string {
  const p = localParts(date, tz);
  return `${dateKey(date, tz)} ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** "jueves 30 de octubre a las 10:30": como se dice en voz alta. */
export function spokenDateTime(date: Date, tz = DEFAULT_TZ): string {
  const day = new Intl.DateTimeFormat("es-ES", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(date);
  const time = new Intl.DateTimeFormat("es-ES", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return `${day} a las ${time}`;
}

/** "jueves 30 de octubre". */
export function spokenDate(date: Date, tz = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("es-ES", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(date);
}

/** Suma días de calendario a una fecha local (año, mes, día). */
export function addLocalDays(year: number, month: number, day: number, days: number) {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), weekday: d.getUTCDay() };
}
