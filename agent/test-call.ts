/**
 * Prueba los agentes con una llamada simulada, sin Vapi y sin teléfono.
 *
 *   npm run agent:test-call
 *
 * Usa Claude de verdad y te envía el resumen a Telegram.
 */
import { onCallEnded } from "@/lib/agents";
import type { CallReport } from "@/lib/calls/types";
import { loadEnv } from "./env-file";

loadEnv();

const FAKE_CALL: CallReport = {
  callId: `prueba-${Date.now()}`,
  assistantId: process.env.VAPI_ASSISTANT_ID ?? null,
  callerNumber: "+34600111222",
  startedAt: new Date(Date.now() - 95_000).toISOString(),
  endedAt: new Date().toISOString(),
  durationSeconds: 95,
  endedReason: "assistant-ended-call",
  costUsd: 0.12,
  recordingUrl: null,
  transcript: `AI: ¡Hola! Clínica Dental Sonríe, soy Lucía, la asistente virtual. Dígame, ¿en qué le puedo ayudar?
User: Hola, mira, es que llevo desde ayer con un dolor de muela que no puedo más.
AI: Lo siento mucho, eso duele bastante. ¿Ha venido alguna vez a la clínica?
User: No, es la primera vez.
AI: De acuerdo. ¿Me dice su nombre, por favor?
User: Javier Moreno.
AI: Muy bien, Javier. ¿Tiene la cara hinchada o fiebre?
User: No, no, solo el dolor, sobre todo al masticar.
AI: Vale. Lo dejo marcado como urgente para que le vean hoy o mañana a primera hora. ¿Le viene mejor por la mañana o por la tarde?
User: Por la tarde, que por la mañana trabajo.
AI: Perfecto. ¿Este número desde el que llama es el mejor para contactarle?
User: Sí, este mismo.
AI: Muy bien.
User: ¿Y aceptáis Mapfre?
AI: Esa información no la tengo ahora mismo, pero lo dejo anotado y la clínica se lo confirma cuando le llame.
User: Vale, gracias.
AI: Le dejo anotada una visita de urgencia por dolor de muela, por la tarde, y la clínica le llamará con prioridad. Que se mejore, un saludo.`,
};

async function main() {
  console.log("\nProcesando llamada simulada…");
  const results = await onCallEnded(FAKE_CALL);
  for (const [step, r] of Object.entries(results)) {
    if (r.status === "ok") console.log(`\n✔ ${step}`, r.detail === undefined ? "" : JSON.stringify(r.detail, null, 2));
    else if (r.status === "saltado") console.log(`\n– ${step}: saltado (${r.reason})`);
    else console.log(`\n✖ ${step}: ${r.error}`);
  }
  console.log();
}

main();
