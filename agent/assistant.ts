import { CLINIC } from "./clinic";
import { buildSystemPrompt } from "./prompt";

/** Términos que suelen transcribirse mal en una clínica dental. */
const TRANSCRIBER_KEYTERMS = [
  "endodoncia",
  "ortodoncia",
  "blanqueamiento",
  "implante",
  "empaste",
  "muela",
  "Adeslas",
  "Sanitas",
  "DKV",
  "Bizum",
];

/**
 * Configuración del asistente en Vapi (POST/PATCH https://api.vapi.ai/assistant).
 * Está pensada para que sea barata y rápida:
 *  - Modelo: Claude Haiku (rápido y económico).
 *  - Voz: Azure Neural (una de las voces más baratas y con buen español de España).
 *  - Transcripción: Deepgram en español.
 */
export function buildAssistant() {
  return {
    name: `Atendo · ${CLINIC.name}`,
    // Se presenta como asistente virtual: la ley de IA de la UE obliga a avisar de que se habla con una IA.
    firstMessage: `¡Hola! ${CLINIC.name}, soy ${CLINIC.assistantName}, la asistente virtual. Dígame, ¿en qué le puedo ayudar?`,
    model: {
      provider: "anthropic",
      model: "claude-haiku-5-5",
      temperature: 0.5, // equilibrio entre naturalidad y respuestas fiables
      maxTokens: 150, // respuestas cortas, como en una llamada real
      messages: [{ role: "system", content: buildSystemPrompt(CLINIC) }],
      tools: [{ type: "endCall" }],
    },
    voice: {
      provider: "azure",
      voiceId: "es-ES-ElviraNeural",
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "es",
      // Palabras que el reconocimiento de voz debe entender bien aunque sean poco comunes.
      keyterm: [CLINIC.name, CLINIC.assistantName, ...TRANSCRIBER_KEYTERMS],
    },
    // Sin ruido de fondo. Vapi pone "office" por defecto en llamadas telefónicas, así que hay que desactivarlo.
    backgroundSound: "off",
    // Cuándo empieza a hablar la asistente tras callar el paciente.
    startSpeakingPlan: {
      waitSeconds: 0.3,
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 0.1, // frase terminada: responde enseguida
        onNoPunctuationSeconds: 0.8, // frase sin terminar: espera un poco (por defecto 1,5 s)
        onNumberSeconds: 1.0, // dictando un número: espera más para no cortar el teléfono a medias
      },
    },
    // Evita que un "ajá" o un ruido corten a la asistente: hacen falta 2 palabras para interrumpirla.
    stopSpeakingPlan: {
      numWords: 2,
    },
    endCallMessage: "Gracias por llamar, que tenga buen día.",
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
    metadata: { project: "atendo", clinic: CLINIC.name },
  };
}
