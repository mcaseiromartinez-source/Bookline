import type { CallReport } from "@/lib/calls/types";
import { escapeHtml as e } from "@/lib/notify/telegram";
import type { CallSummary } from "./summary";

const TIPO: Record<CallSummary["tipo"], string> = {
  cita_nueva: "Cita nueva",
  cambio_cita: "Cambio de cita",
  cancelacion: "Cancelación",
  consulta: "Consulta",
  urgencia: "Urgencia",
  otro: "Otro",
};

const URGENCIA: Record<CallSummary["urgencia"], string> = {
  alta: "🔴 URGENTE",
  media: "🟠 Prioridad media",
  baja: "🟢 Normal",
};

const formatDuration = (s: number | null) => (s === null ? "?" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);

/** Mensaje de Telegram (HTML) con el resumen de una llamada. */
export function formatSummaryMessage(summary: CallSummary, report: CallReport, clinicName: string): string {
  const phone = summary.telefonoContacto ?? report.callerNumber;
  const lines = [
    `<b>📞 ${e(clinicName)} · ${TIPO[summary.tipo]}</b>`,
    URGENCIA[summary.urgencia],
    "",
    `<b>Paciente:</b> ${e(summary.pacienteNombre ?? "Sin nombre")}${
      summary.pacienteNuevo === true ? " (nuevo)" : summary.pacienteNuevo === false ? " (ya es paciente)" : ""
    }`,
    `<b>Teléfono:</b> ${phone ? e(phone) : "No disponible"}`,
    `<b>Motivo:</b> ${e(summary.motivo)}`,
  ];
  if (summary.preferenciaHoraria) lines.push(`<b>Prefiere:</b> ${e(summary.preferenciaHoraria)}`);
  lines.push("", `👉 <b>${e(summary.accionRequerida)}</b>`, "", `<i>${e(summary.resumen)}</i>`);
  if (summary.pendientes.length) {
    lines.push("", "<b>Pendiente de aclarar:</b>", ...summary.pendientes.map((p) => `• ${e(p)}`));
  }
  lines.push("", `⏱ ${formatDuration(report.durationSeconds)} min${report.recordingUrl ? ` · <a href="${e(report.recordingUrl)}">Grabación</a>` : ""}`);
  return lines.join("\n");
}
