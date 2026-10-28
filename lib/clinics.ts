import { CLINIC, type Clinic as ClinicConfig } from "@/agent/clinic";
import { ensureClinic } from "@/lib/db/repo";
import { isEnabled } from "@/lib/integrations";
import type { SchedulingBackend } from "@/lib/scheduling/backend";
import { GoogleCalendarBackend } from "@/lib/scheduling/google-calendar";

/**
 * Datos de la clínica a la que pertenece una llamada.
 * Hoy hay una sola configuración (agent/clinic.ts); la base de datos aporta
 * su id, emails de aviso y calendario. Cuando haya varias clínicas, aquí se
 * elegirá la configuración por el asistente de Vapi.
 */
export interface ResolvedClinic {
  config: ClinicConfig;
  /** Id en la base de datos, o null si Supabase no está conectado. */
  id: string | null;
  name: string;
  notifyEmails: string[];
  calendarId: string | null;
}

const envList = (key: string) =>
  (process.env[key] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function resolveClinic(assistantId: string | null): Promise<ResolvedClinic> {
  const fallback: ResolvedClinic = {
    config: CLINIC,
    id: null,
    name: CLINIC.name,
    notifyEmails: envList("CLINIC_NOTIFY_EMAILS"),
    calendarId: process.env.GOOGLE_CALENDAR_ID?.trim() || null,
  };
  if (!assistantId || !isEnabled("supabase")) return fallback;

  try {
    const clinic = await ensureClinic(assistantId, CLINIC.name);
    return {
      config: CLINIC,
      id: clinic.id,
      name: clinic.name,
      notifyEmails: clinic.notifyEmails.length ? clinic.notifyEmails : fallback.notifyEmails,
      calendarId: clinic.googleCalendarId ?? fallback.calendarId,
    };
  } catch (err) {
    console.error("[clínicas] no se pudo leer la clínica de la base de datos, uso la configuración por defecto:", err);
    return fallback;
  }
}

/** Programa de agenda de la clínica, o null si no hay ninguno conectado. */
export function schedulingFor(clinic: ResolvedClinic): SchedulingBackend | null {
  const hasGoogle = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() && process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim());
  if (hasGoogle && clinic.calendarId) return new GoogleCalendarBackend(clinic.calendarId);
  return null;
}
