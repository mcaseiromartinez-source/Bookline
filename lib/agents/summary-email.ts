import type { CallReport } from "@/lib/calls/types";
import { escapeHtml as e } from "@/lib/notify/telegram";
import type { CallSummary } from "./summary";

const TIPO: Record<CallSummary["tipo"], string> = {
  cita_nueva: "Cita nueva",
  cambio_cita: "Cambio de cita",
  cancelacion: "Cancelación",
  consulta: "Consulta",
  urgencia: "Urgencia",
  otro: "Llamada",
};

const COLOR: Record<CallSummary["urgencia"], string> = { alta: "#e11d48", media: "#f59e0b", baja: "#10b981" };
const LABEL: Record<CallSummary["urgencia"], string> = { alta: "URGENTE", media: "Prioridad media", baja: "Normal" };

/** Email (HTML sencillo, compatible con todos los gestores de correo) para la clínica. */
export function formatSummaryEmail(summary: CallSummary, report: CallReport, clinicName: string, panelUrl: string | null) {
  const phone = summary.telefonoContacto ?? report.callerNumber ?? "No disponible";
  const subject = `${summary.urgencia === "alta" ? "🔴 URGENTE · " : ""}${TIPO[summary.tipo]}: ${summary.pacienteNombre ?? phone}`;
  const row = (label: string, value: string | null) =>
    value ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;white-space:nowrap">${label}</td><td style="padding:6px 0;color:#0f172a">${e(value)}</td></tr>` : "";

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px">
<tr><td>
  <p style="margin:0 0 4px;font-size:13px;color:#64748b">${e(clinicName)} · Atendo</p>
  <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a">${TIPO[summary.tipo]}</h1>
  <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${COLOR[summary.urgencia]};color:#fff;font-size:12px;font-weight:bold">${LABEL[summary.urgencia]}</span>
  <p style="margin:16px 0;padding:12px;background:#ecfeff;border-radius:8px;color:#0e7490;font-weight:bold">👉 ${e(summary.accionRequerida)}</p>
  <table role="presentation" style="font-size:14px">
    ${row("Paciente", `${summary.pacienteNombre ?? "Sin nombre"}${summary.pacienteNuevo ? " (nuevo)" : ""}`)}
    ${row("Teléfono", phone)}
    ${row("Motivo", summary.motivo)}
    ${row("Prefiere", summary.preferenciaHoraria)}
  </table>
  <p style="margin:16px 0 0;color:#334155;font-size:14px;font-style:italic">${e(summary.resumen)}</p>
  ${summary.pendientes.length ? `<p style="margin:16px 0 4px;font-size:14px;font-weight:bold;color:#0f172a">Pendiente de aclarar</p><ul style="margin:0;padding-left:20px;color:#334155;font-size:14px">${summary.pendientes.map((p) => `<li>${e(p)}</li>`).join("")}</ul>` : ""}
  ${panelUrl ? `<p style="margin:24px 0 0"><a href="${e(panelUrl)}" style="display:inline-block;padding:10px 18px;background:#0891b2;color:#fff;border-radius:999px;text-decoration:none;font-weight:bold;font-size:14px">Ver llamada completa</a></p>` : ""}
</td></tr></table>
<p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px">Este aviso contiene datos personales de pacientes. No lo reenvíes fuera de la clínica.</p>
</body></html>`;
  return { subject, html };
}
