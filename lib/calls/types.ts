/**
 * Llamada terminada, en un formato propio e independiente de Vapi.
 * Si algún día cambiamos de proveedor de voz, solo hay que adaptar el parser,
 * no los agentes.
 */
export interface CallReport {
  callId: string;
  /** Asistente de Vapi que atendió la llamada: identifica a la clínica. */
  assistantId: string | null;
  /** Número del que llama, en formato internacional si está disponible. */
  callerNumber: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  /** Motivo de fin de llamada según el proveedor (cuelga el cliente, el asistente…). */
  endedReason: string | null;
  /** Coste de la llamada en USD según el proveedor. */
  costUsd: number | null;
  /** Transcripción completa en texto, con turnos "AI:" / "User:". */
  transcript: string;
  recordingUrl: string | null;
}
