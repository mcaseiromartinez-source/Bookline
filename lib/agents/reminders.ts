import { CLINIC } from "@/agent/clinic";
import { appointmentsNeedingReminder, markReminderSent } from "@/lib/db/repo";
import type { Appointment } from "@/lib/db/types";
import { assertEnabled, isEnabled, type IntegrationId } from "@/lib/integrations";
import { placeReminderCall } from "@/lib/notify/call";
import { sendSms } from "@/lib/notify/sms";
import { escapeHtml, sendTelegram } from "@/lib/notify/telegram";
import { sendWhatsAppTemplate } from "@/lib/notify/whatsapp";
import { addLocalDays, localParts, spokenDateTime, zonedTime } from "@/lib/time";

/**
 * AGENTE DE RECORDATORIOS
 * Una vez al día (Vercel Cron) busca las citas de MAÑANA y avisa a cada paciente
 * por el primer canal disponible, en el orden de REMINDER_CHANNELS
 * (por defecto: whatsapp, sms, llamada).
 *
 * Importante (RGPD): la clínica debe informar a sus pacientes de que recibirán
 * recordatorios. Lucía lo avisa al reservar; cada cita tiene `reminders_enabled`.
 */

type Channel = "whatsapp" | "sms" | "llamada";

const CHANNEL_INTEGRATION: Record<Channel, IntegrationId> = {
  whatsapp: "whatsapp",
  sms: "sms",
  llamada: "outboundCall",
};

function channelOrder(): Channel[] {
  const raw = (process.env.REMINDER_CHANNELS ?? "whatsapp,sms,llamada").split(",").map((c) => c.trim());
  return raw.filter((c): c is Channel => c in CHANNEL_INTEGRATION);
}

async function sendVia(channel: Channel, appt: Appointment & { clinicName: string }) {
  const clinicName = appt.clinicName || CLINIC.name;
  const when = spokenDateTime(new Date(appt.startsAt), CLINIC.timezone);
  const firstName = appt.patientName.split(" ")[0];

  if (channel === "whatsapp") {
    await sendWhatsAppTemplate(appt.patientPhone, [firstName, clinicName, when]);
  } else if (channel === "sms") {
    await sendSms(
      appt.patientPhone,
      `Hola ${firstName}, te recordamos tu cita en ${clinicName} el ${when}. Si no puedes venir, llama al ${CLINIC.phoneForHumans}.`,
    );
  } else {
    await placeReminderCall(appt.patientPhone, { clinicName, patientName: appt.patientName, when });
  }
}

export interface ReminderRun {
  total: number;
  sent: { name: string; channel: Channel }[];
  failed: { name: string; error: string }[];
}

export async function sendTomorrowReminders(now = new Date()): Promise<ReminderRun> {
  assertEnabled("supabase");
  const channels = channelOrder().filter((c) => isEnabled(CHANNEL_INTEGRATION[c]));
  if (!channels.length) throw new Error("No hay ningún canal de recordatorio conectado (WhatsApp, SMS o llamadas)");

  const today = localParts(now, CLINIC.timezone);
  const tomorrow = addLocalDays(today.year, today.month, today.day, 1);
  const dayAfter = addLocalDays(today.year, today.month, today.day, 2);
  const from = zonedTime(tomorrow.year, tomorrow.month, tomorrow.day, 0, 0, CLINIC.timezone);
  const to = zonedTime(dayAfter.year, dayAfter.month, dayAfter.day, 0, 0, CLINIC.timezone);

  const appointments = await appointmentsNeedingReminder(from, to);
  const run: ReminderRun = { total: appointments.length, sent: [], failed: [] };

  for (const appt of appointments) {
    let lastError = "";
    for (const channel of channels) {
      try {
        await sendVia(channel, appt);
        await markReminderSent(appt.id, channel);
        run.sent.push({ name: appt.patientName, channel });
        lastError = "";
        break;
      } catch (err) {
        lastError = `${channel}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`[recordatorios] ${appt.patientName} por ${channel} falló:`, err);
      }
    }
    if (lastError) run.failed.push({ name: appt.patientName, error: lastError });
  }

  if (isEnabled("telegram") && run.total) {
    const lines = [
      `<b>⏰ Recordatorios de mañana</b>`,
      `Enviados: ${run.sent.length} de ${run.total}`,
      ...run.failed.map((f) => `✖ ${escapeHtml(f.name)}: ${escapeHtml(f.error)}`),
    ];
    await sendTelegram(lines.join("\n")).catch((err) => console.error("[recordatorios] aviso a Telegram falló:", err));
  }
  return run;
}
