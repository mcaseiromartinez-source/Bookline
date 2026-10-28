import { assertEnabled, requireEnv } from "@/lib/integrations";

/**
 * Llamada saliente con Vapi: la asistente llama al paciente para recordarle la cita.
 * Necesita un número de teléfono en Vapi (VAPI_PHONE_NUMBER_ID).
 */
export async function placeReminderCall(to: string, opts: { clinicName: string; patientName: string; when: string }) {
  assertEnabled("outboundCall");
  const firstName = opts.patientName.split(" ")[0];
  const res = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: { Authorization: `Bearer ${requireEnv("VAPI_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumberId: requireEnv("VAPI_PHONE_NUMBER_ID"),
      customer: { number: to },
      assistant: {
        name: `Recordatorio · ${opts.clinicName}`,
        firstMessage: `Hola, ¿hablo con ${firstName}? Le llamo de ${opts.clinicName}, soy la asistente virtual. Era para recordarle su cita del ${opts.when}.`,
        model: {
          provider: "anthropic",
          model: "claude-haiku-5-5",
          maxTokens: 120,
          messages: [
            {
              role: "system",
              content: `Eres la asistente virtual de ${opts.clinicName} y llamas a ${opts.patientName} para recordarle su cita del ${opts.when}.
Habla en español de España, con frases cortas, de usted y con tono amable.
- Si confirma que vendrá: agradécelo, despídete y cuelga.
- Si no puede venir o quiere cambiarla: di que lo dejas anotado y que la clínica le llamará para darle otra hora. Despídete y cuelga.
- Si no es la persona correcta o no sabe de qué hablas: discúlpate, despídete y cuelga.
- Si salta un contestador: deja un mensaje breve con la cita y cuelga.
No des información médica ni de precios. Nunca inventes datos.`,
            },
          ],
          tools: [{ type: "endCall" }],
        },
        voice: { provider: "azure", voiceId: "es-ES-ElviraNeural" },
        transcriber: { provider: "deepgram", model: "nova-3", language: "es" },
        backgroundSound: "off",
        maxDurationSeconds: 120,
      },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Vapi (llamada saliente) respondió ${res.status}: ${detail.slice(0, 300)}`);
  }
}
