import { assertEnabled, requireEnv } from "@/lib/integrations";

/**
 * Envía una plantilla de WhatsApp (API oficial de Meta, WhatsApp Cloud API).
 * Fuera de una conversación abierta por el paciente, WhatsApp SOLO permite
 * plantillas aprobadas por Meta. La plantilla de recordatorio debe tener
 * variables en el cuerpo, por ejemplo:
 *   "Hola {{1}}, te recordamos tu cita en {{2}} el {{3}}. Si no puedes venir, llámanos."
 */
export async function sendWhatsAppTemplate(to: string, params: string[], template = requireEnv("WHATSAPP_REMINDER_TEMPLATE")) {
  assertEnabled("whatsapp");
  const res = await fetch(`https://graph.facebook.com/v21.0/${requireEnv("WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${requireEnv("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "template",
      template: {
        name: template,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "es" },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
      },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`WhatsApp respondió ${res.status}: ${detail.slice(0, 300)}`);
  }
}
