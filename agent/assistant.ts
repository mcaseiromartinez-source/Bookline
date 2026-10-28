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

export interface ServerOptions {
  /** URL pública de la web, p. ej. https://atendo.vercel.app */
  baseUrl: string;
  /** Contraseña que Vapi envía en cada aviso (cabecera x-atendo-secret). */
  secret: string;
  /** true si la agenda (Google Calendar) está conectada. */
  booking: boolean;
}

/** Herramientas de agenda que Lucía puede usar durante la llamada. */
function bookingTools(server: { url: string; headers: Record<string, string> }) {
  return [
    {
      type: "function",
      function: {
        name: "consultar_huecos",
        description: "Busca huecos libres en la agenda de la clínica.",
        parameters: {
          type: "object",
          properties: {
            dia: {
              type: "string",
              description: 'Día que pide el paciente tal como lo dice: "hoy", "mañana", "el jueves", "30/10". Vacío si no tiene preferencia.',
            },
            franja: { type: "string", enum: ["mañana", "tarde", "cualquiera"] },
          },
        },
      },
      server,
      messages: [{ type: "request-start", content: "Un momento, que lo miro." }],
    },
    {
      type: "function",
      function: {
        name: "reservar_cita",
        description: "Reserva una cita en un hueco que ha devuelto consultar_huecos y que el paciente ha aceptado.",
        parameters: {
          type: "object",
          properties: {
            inicio: { type: "string", description: 'El "inicio" exacto que devolvió consultar_huecos (formato ISO).' },
            nombre: { type: "string", description: "Nombre y apellido del paciente." },
            telefono: { type: "string", description: "Teléfono confirmado por el paciente, solo dígitos." },
            motivo: { type: "string", description: "Motivo de la visita en pocas palabras." },
            pacienteNuevo: { type: "boolean" },
            urgente: { type: "boolean" },
          },
          required: ["inicio", "nombre", "telefono"],
        },
      },
      server,
      messages: [{ type: "request-start", content: "Perfecto, se la reservo." }],
    },
  ];
}

/**
 * Configuración del asistente en Vapi (POST/PATCH https://api.vapi.ai/assistant).
 * Está pensada para que sea barata y rápida:
 *  - Modelo: Claude Haiku (rápido y económico).
 *  - Voz: Azure Neural (una de las voces más baratas y con buen español de España).
 *  - Transcripción: Deepgram en español.
 */
export function buildAssistant(serverOptions?: ServerOptions) {
  const server = serverOptions && {
    url: `${serverOptions.baseUrl}/api/vapi/webhook`,
    headers: { "x-atendo-secret": serverOptions.secret },
  };
  const toolServer = serverOptions && {
    url: `${serverOptions.baseUrl}/api/vapi/tools`,
    headers: { "x-atendo-secret": serverOptions.secret },
  };
  const booking = Boolean(serverOptions?.booking && toolServer);

  return {
    name: `Atendo · ${CLINIC.name}`,
    // Se presenta como asistente virtual: la ley de IA de la UE obliga a avisar de que se habla con una IA.
    firstMessage: `¡Hola! ${CLINIC.name}, soy ${CLINIC.assistantName}, la asistente virtual. Dígame, ¿en qué le puedo ayudar?`,
    model: {
      provider: "anthropic",
      model: "claude-haiku-5-5",
      temperature: 0.5, // equilibrio entre naturalidad y respuestas fiables
      maxTokens: 150, // respuestas cortas, como en una llamada real
      messages: [{ role: "system", content: buildSystemPrompt(CLINIC, { booking }) }],
      tools: [{ type: "endCall" }, ...(booking && toolServer ? bookingTools(toolServer) : [])],
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
    // Aviso al terminar cada llamada para que trabajen los agentes.
    ...(server ? { server, serverMessages: ["end-of-call-report"] } : {}),
  };
}
