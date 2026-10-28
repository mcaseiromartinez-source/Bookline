import type { CallReport } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Convierte el aviso "end-of-call-report" de Vapi en un CallReport.
 * Es defensivo: Vapi ha cambiado algunos campos de sitio entre versiones
 * (p. ej. `transcript` en la raíz o dentro de `artifact`).
 * Devuelve null si el mensaje no es un informe de fin de llamada.
 */
export function parseVapiEndOfCall(body: any): CallReport | null {
  const msg = body?.message;
  if (!msg || msg.type !== "end-of-call-report") return null;

  const call = msg.call ?? {};
  const artifact = msg.artifact ?? {};
  const startedAt = str(msg.startedAt) ?? str(call.startedAt);
  const endedAt = str(msg.endedAt) ?? str(call.endedAt);

  let durationSeconds = num(msg.durationSeconds);
  if (durationSeconds === null && startedAt && endedAt) {
    durationSeconds = Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000);
  }

  return {
    callId: str(call.id) ?? str(msg.callId) ?? `sin-id-${Date.now()}`,
    assistantId: str(msg.assistant?.id) ?? str(call.assistantId),
    callerNumber: str(msg.customer?.number) ?? str(call.customer?.number),
    startedAt,
    endedAt,
    durationSeconds,
    endedReason: str(msg.endedReason),
    costUsd: num(msg.cost) ?? num(call.cost),
    transcript: str(artifact.transcript) ?? str(msg.transcript) ?? "",
    recordingUrl: str(artifact.recordingUrl) ?? str(msg.recordingUrl),
  };
}
