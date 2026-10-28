/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CallReport } from "@/lib/calls/types";
import { getAdminDb } from "./admin";
import type { Appointment, CallRecord, Clinic, Lead } from "./types";

/**
 * Operaciones de base de datos que usan los agentes (servidor, clave de servicio).
 * Si Supabase no está conectado, getAdminDb() lanza NotConfiguredError.
 */

const check = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
  if (error) throw new Error(`Base de datos: ${error.message}`);
  return data;
};

export const toClinic = (r: any): Clinic => ({
  id: r.id,
  name: r.name,
  vapiAssistantId: r.vapi_assistant_id,
  notifyEmails: r.notify_emails ?? [],
  monthlyPriceEur: Number(r.monthly_price_eur ?? 0),
  googleCalendarId: r.google_calendar_id,
});

export const toCall = (r: any): CallRecord => ({
  id: r.id,
  clinicId: r.clinic_id,
  vapiCallId: r.vapi_call_id,
  callerNumber: r.caller_number,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  durationSeconds: r.duration_seconds,
  endedReason: r.ended_reason,
  costUsd: r.cost_usd === null ? null : Number(r.cost_usd),
  transcript: r.transcript ?? "",
  recordingUrl: r.recording_url,
  summary: r.summary,
  quality: r.quality,
  handledAt: r.handled_at,
  createdAt: r.created_at,
});

export const toAppointment = (r: any): Appointment => ({
  id: r.id,
  clinicId: r.clinic_id,
  vapiCallId: r.vapi_call_id,
  patientName: r.patient_name,
  patientPhone: r.patient_phone,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  reason: r.reason,
  isNewPatient: r.is_new_patient,
  urgent: r.urgent,
  status: r.status,
  calendarEventId: r.calendar_event_id,
  remindersEnabled: r.reminders_enabled,
  reminderSentAt: r.reminder_sent_at,
});

/** Busca la clínica de un asistente de Vapi; si no existe, la crea. */
export async function ensureClinic(vapiAssistantId: string, name: string): Promise<Clinic> {
  const db = getAdminDb();
  const found = check(await db.from("clinics").select("*").eq("vapi_assistant_id", vapiAssistantId).maybeSingle());
  if (found) return toClinic(found);
  const created = check(
    await db.from("clinics").insert({ name, vapi_assistant_id: vapiAssistantId }).select("*").single(),
  );
  return toClinic(created);
}

export async function saveCall(clinicId: string, report: CallReport): Promise<CallRecord> {
  const row = check(
    await getAdminDb()
      .from("calls")
      .upsert(
        {
          clinic_id: clinicId,
          vapi_call_id: report.callId,
          caller_number: report.callerNumber,
          started_at: report.startedAt,
          ended_at: report.endedAt,
          duration_seconds: report.durationSeconds,
          ended_reason: report.endedReason,
          cost_usd: report.costUsd,
          transcript: report.transcript,
          recording_url: report.recordingUrl,
        },
        { onConflict: "vapi_call_id" },
      )
      .select("*")
      .single(),
  );
  return toCall(row);
}

export async function updateCallByVapiId(vapiCallId: string, patch: Record<string, unknown>) {
  check(await getAdminDb().from("calls").update(patch).eq("vapi_call_id", vapiCallId));
}

export async function createAppointment(a: Omit<Appointment, "id" | "status" | "reminderSentAt">): Promise<Appointment> {
  const row = check(
    await getAdminDb()
      .from("appointments")
      .insert({
        clinic_id: a.clinicId,
        vapi_call_id: a.vapiCallId,
        patient_name: a.patientName,
        patient_phone: a.patientPhone,
        starts_at: a.startsAt,
        ends_at: a.endsAt,
        reason: a.reason,
        is_new_patient: a.isNewPatient,
        urgent: a.urgent,
        calendar_event_id: a.calendarEventId,
        reminders_enabled: a.remindersEnabled,
      })
      .select("*")
      .single(),
  );
  return toAppointment(row);
}

/** Citas confirmadas que empiezan entre `from` y `to` y aún no tienen recordatorio. */
export async function appointmentsNeedingReminder(from: Date, to: Date): Promise<(Appointment & { clinicName: string })[]> {
  const rows = check(
    await getAdminDb()
      .from("appointments")
      .select("*, clinics(name)")
      .eq("status", "confirmada")
      .eq("reminders_enabled", true)
      .is("reminder_sent_at", null)
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString()),
  );
  return (rows ?? []).map((r: any) => ({ ...toAppointment(r), clinicName: r.clinics?.name ?? "" }));
}

export async function markReminderSent(appointmentId: string, channel: string) {
  check(
    await getAdminDb()
      .from("appointments")
      .update({ reminder_sent_at: new Date().toISOString(), reminder_channel: channel })
      .eq("id", appointmentId),
  );
}

export async function upsertLeads(leads: Lead[]) {
  if (!leads.length) return;
  check(
    await getAdminDb()
      .from("leads")
      .upsert(
        leads.map((l) => ({
          place_id: l.placeId,
          search_query: l.searchQuery,
          name: l.name,
          address: l.address,
          phone: l.phone,
          website: l.website,
          emails: l.emails,
          instagram: l.instagram,
          facebook: l.facebook,
          rating: l.rating,
          reviews: l.reviews,
          maps_url: l.mapsUrl,
          pitch: l.pitch,
        })),
        { onConflict: "place_id", ignoreDuplicates: false },
      ),
  );
}
