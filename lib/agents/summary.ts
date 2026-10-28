import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { CallReport } from "@/lib/calls/types";
import { assertEnabled } from "@/lib/integrations";

/**
 * AGENTE DE RESUMEN
 * Lee la transcripción de una llamada y extrae lo que la clínica necesita saber.
 * Usa Claude Haiku 5.5: es el modelo más barato y sobra para extraer datos.
 */

export const CallSummarySchema = z.object({
  tipo: z
    .enum(["cita_nueva", "cambio_cita", "cancelacion", "consulta", "urgencia", "otro"])
    .describe("Motivo principal de la llamada"),
  urgencia: z.enum(["alta", "media", "baja"]).describe("alta = dolor fuerte, rotura, inflamación o derivada al 112"),
  pacienteNombre: z.string().nullable().describe("Nombre y apellido tal como lo dijo el paciente, o null"),
  pacienteNuevo: z.boolean().nullable().describe("true si es su primera vez en la clínica, null si no se sabe"),
  telefonoContacto: z
    .string()
    .nullable()
    .describe("Teléfono que confirmó el paciente para contactarle, solo dígitos y +. null si no lo dio"),
  motivo: z.string().describe("Motivo de la visita o consulta, en pocas palabras"),
  preferenciaHoraria: z.string().nullable().describe("Días o franja que prefiere, o null"),
  accionRequerida: z.string().describe("Qué tiene que hacer la clínica ahora, en una frase y en imperativo"),
  resumen: z.string().describe("Resumen de la llamada en una o dos frases"),
  pendientes: z
    .array(z.string())
    .describe("Preguntas que la asistente no supo responder o datos que quedaron sin aclarar. Vacío si no hay"),
});

export type CallSummary = z.infer<typeof CallSummarySchema>;

const SYSTEM_PROMPT = `Eres el agente que resume las llamadas que atiende la recepcionista virtual de una clínica.
Recibes la transcripción de una llamada y extraes los datos para que el equipo de la clínica actúe sin tener que escucharla.

Reglas:
- Usa solo lo que aparece en la transcripción. Si un dato no se dijo, pon null. Nunca lo inventes.
- Si el paciente corrigió un dato durante la llamada, usa la versión corregida.
- Escribe en español de España, claro y breve.
- "accionRequerida" debe ser accionable: por ejemplo "Llamar hoy para darle cita de urgencia por dolor de muela".
- Si la llamada fue publicidad, un error o se cortó sin información útil, usa tipo "otro" y dilo en el resumen.`;

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export async function summarizeCall(report: CallReport): Promise<CallSummary> {
  assertEnabled("anthropic");
  if (!report.transcript.trim()) {
    return {
      tipo: "otro",
      urgencia: "baja",
      pacienteNombre: null,
      pacienteNuevo: null,
      telefonoContacto: null,
      motivo: "Sin conversación",
      preferenciaHoraria: null,
      accionRequerida: report.callerNumber ? `Devolver la llamada al ${report.callerNumber}` : "Ninguna",
      resumen: "La llamada terminó sin que el paciente dijera nada (colgó o se cortó).",
      pendientes: [],
    };
  }

  const response = await getClient().messages.parse({
    model: "claude-haiku-5-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: "low",
      format: zodOutputFormat(CallSummarySchema),
    },
    messages: [
      {
        role: "user",
        content: `Número desde el que llamó: ${report.callerNumber ?? "desconocido"}\n\nTranscripción:\n${report.transcript}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude rechazó resumir la llamada");
  }
  if (!response.parsed_output) {
    throw new Error(`El resumen no tiene el formato esperado (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output;
}
