import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { CLINIC } from "@/agent/clinic";
import { buildSystemPrompt } from "@/agent/prompt";
import type { CallReport } from "@/lib/calls/types";
import { assertEnabled, isEnabled } from "@/lib/integrations";

/**
 * AGENTE DE CALIDAD
 * Revisa cada llamada como lo haría un supervisor: compara lo que dijo la asistente
 * con su guion y detecta errores (datos inventados, urgencias mal gestionadas,
 * frases robóticas…). Sus sugerencias sirven para mejorar agent/prompt.ts.
 */

export const QualityReviewSchema = z.object({
  puntuacion: z.number().int().describe("Nota global de la llamada, de 1 a 10 (10 = perfecta)"),
  resolvio: z.boolean().describe("true si el paciente colgó con su asunto resuelto o bien encaminado"),
  errores: z
    .array(
      z.object({
        gravedad: z.enum(["grave", "leve"]),
        tipo: z.enum([
          "dato_inventado",
          "urgencia_mal_gestionada",
          "consejo_medico",
          "dato_no_confirmado",
          "no_entendio",
          "frase_robotica",
          "demasiado_larga",
          "otro",
        ]),
        cita: z.string().describe("Frase exacta de la asistente donde está el error"),
        explicacion: z.string(),
      }),
    )
    .describe("Errores de la ASISTENTE (no del paciente). Vacío si no hay"),
  sugerenciasGuion: z.array(z.string()).describe("Cambios concretos al guion para que no se repitan los errores"),
  resumen: z.string().describe("Valoración en una frase"),
});

export type QualityReview = z.infer<typeof QualityReviewSchema>;

const SYSTEM_PROMPT = `Eres el supervisor de calidad de una recepcionista telefónica virtual.
Te paso su guion y la transcripción de una llamada. Evalúa SOLO a la asistente ("AI:"), no al paciente ("User:").

Errores graves: inventar información que no está en el guion, confirmar citas u horas sin tener agenda, no derivar al 112 cuando correspondía, dar consejos médicos o de medicación, dar por bueno un teléfono sin confirmarlo.
Errores leves: frases que suenan a robot, respuestas demasiado largas, repetir preguntas ya respondidas, tono poco natural.

Sé justo: si la llamada fue buena, dilo y no inventes errores. Ten en cuenta que la transcripción automática puede tener fallos de audio que no son culpa de la asistente.
Responde en español de España.`;

let client: Anthropic | null = null;

export async function reviewCallQuality(report: CallReport): Promise<QualityReview | null> {
  assertEnabled("anthropic");
  if (!report.transcript.trim()) return null;

  client ??= new Anthropic();
  const response = await client.messages.parse({
    model: "claude-haiku-5-5",
    max_tokens: 6000,
    system: SYSTEM_PROMPT,
    output_config: { effort: "medium", format: zodOutputFormat(QualityReviewSchema) },
    messages: [
      {
        role: "user",
        content: `<guion>\n${buildSystemPrompt(CLINIC, { booking: isEnabled("calendar") && isEnabled("server") })}\n</guion>\n\n<transcripcion>\n${report.transcript}\n</transcripcion>`,
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new Error("Claude rechazó revisar la llamada");
  if (!response.parsed_output) throw new Error(`Revisión sin formato válido (stop_reason: ${response.stop_reason})`);
  return response.parsed_output;
}

/** ¿Merece la pena avisarte? Nota baja o algún error grave. */
export const needsAttention = (q: QualityReview) => q.puntuacion < 7 || q.errores.some((e) => e.gravedad === "grave");
