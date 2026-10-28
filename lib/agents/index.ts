import type { CallReport } from "@/lib/calls/types";
import { resolveClinic } from "@/lib/clinics";
import { saveCall, updateCallByVapiId } from "@/lib/db/repo";
import { isEnabled, NotConfiguredError } from "@/lib/integrations";
import { sendEmail } from "@/lib/notify/email";
import { escapeHtml, sendTelegram } from "@/lib/notify/telegram";
import { recordCallCost } from "./costs";
import { needsAttention, reviewCallQuality, type QualityReview } from "./quality";
import { summarizeCall, type CallSummary } from "./summary";
import { formatSummaryEmail } from "./summary-email";
import { formatSummaryMessage } from "./summary-message";

/**
 * ORQUESTADOR: cuando termina una llamada, reparte el trabajo entre los agentes.
 *
 *   1. Guardar la llamada            (base de datos)
 *   2. Resumen                        (Claude)
 *   3. En paralelo:
 *      - aviso a ti                   (Telegram)
 *      - aviso a la clínica           (email, con enlace al panel)
 *      - costes                       (Google Sheets)
 *      - calidad                      (Claude → base de datos y aviso si hay errores)
 *
 * Cada paso es independiente: si un servicio no está conectado se "salta",
 * y si falla no impide que los demás se ejecuten.
 */

export type StepResult =
  | { status: "ok"; detail?: unknown }
  | { status: "saltado"; reason: string }
  | { status: "error"; error: string };

async function step(name: string, callId: string, fn: () => Promise<unknown>): Promise<StepResult> {
  try {
    return { status: "ok", detail: await fn() };
  } catch (err) {
    if (err instanceof NotConfiguredError) return { status: "saltado", reason: err.message };
    if (err instanceof SkipError) return { status: "saltado", reason: err.message };
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[agente ${name}] falló en la llamada ${callId}:`, err);
    return { status: "error", error: message };
  }
}

class SkipError extends Error {}
const skip = (reason: string): never => {
  throw new SkipError(reason);
};

export async function onCallEnded(report: CallReport): Promise<Record<string, StepResult>> {
  const results: Record<string, StepResult> = {};
  const clinic = await resolveClinic(report.assistantId);

  results.guardar = await step("guardar", report.callId, async () => {
    if (!clinic.id) skip("Supabase no conectado");
    return (await saveCall(clinic.id!, report)).id;
  });
  const callDbId = results.guardar.status === "ok" ? (results.guardar.detail as string) : null;

  let summary: CallSummary | null = null;
  results.resumen = await step("resumen", report.callId, async () => {
    summary = await summarizeCall(report);
    return summary;
  });

  const needSummary = () => summary ?? skip("No hay resumen");
  const panelUrl =
    callDbId && process.env.PUBLIC_BASE_URL ? `${process.env.PUBLIC_BASE_URL.replace(/\/+$/, "")}/panel/llamadas/${callDbId}` : null;

  const parallel: Record<string, () => Promise<unknown>> = {
    guardar_resumen: async () => {
      const s = needSummary();
      if (!callDbId) skip("La llamada no está guardada");
      await updateCallByVapiId(report.callId, { summary: s, tipo: s.tipo, urgencia: s.urgencia, patient_name: s.pacienteNombre });
    },
    aviso_telegram: async () => {
      if (!isEnabled("telegram")) skip("Telegram no conectado");
      await sendTelegram(formatSummaryMessage(needSummary(), report, clinic.name));
    },
    aviso_email: async () => {
      if (!isEnabled("email")) skip("Email no conectado");
      if (!clinic.notifyEmails.length) skip("La clínica no tiene emails de aviso");
      const { subject, html } = formatSummaryEmail(needSummary(), report, clinic.name, panelUrl);
      await sendEmail(clinic.notifyEmails, subject, html);
    },
    costes: async () => {
      const s = summary as CallSummary | null;
      await recordCallCost({ report, clinicName: clinic.name, tipo: s?.tipo, urgencia: s?.urgencia, paciente: s?.pacienteNombre });
    },
    calidad: async () => {
      const review: QualityReview | null = await reviewCallQuality(report);
      if (!review) skip("Llamada sin conversación");
      if (callDbId) await updateCallByVapiId(report.callId, { quality: review, quality_score: review!.puntuacion });
      if (needsAttention(review!) && isEnabled("telegram")) {
        const errors = review!.errores.map((e) => `• [${e.gravedad}] «${escapeHtml(e.cita)}»: ${escapeHtml(e.explicacion)}`);
        const tips = review!.sugerenciasGuion.map((t) => `→ ${escapeHtml(t)}`);
        await sendTelegram(
          [`<b>⚠️ Calidad ${review!.puntuacion}/10 · ${escapeHtml(clinic.name)}</b>`, escapeHtml(review!.resumen), "", ...errors, "", ...tips].join("\n"),
        );
      }
      return review;
    },
  };

  const names = Object.keys(parallel);
  const settled = await Promise.all(names.map((name) => step(name, report.callId, parallel[name])));
  names.forEach((name, i) => (results[name] = settled[i]));
  return results;
}
