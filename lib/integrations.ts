/**
 * Registro de servicios externos.
 * Cada función del sistema comprueba aquí si su servicio está conectado.
 * Si falta alguna clave, esa función se salta (y lo avisa) sin romper el resto.
 */

export const INTEGRATIONS = {
  vapi: {
    name: "Vapi · voz de Lucía",
    keys: ["VAPI_API_KEY", "VAPI_ASSISTANT_ID"],
    unlocks: "La asistente telefónica",
  },
  anthropic: {
    name: "Anthropic · Claude",
    keys: ["ANTHROPIC_API_KEY"],
    unlocks: "Agentes de resumen, calidad y ventas",
  },
  telegram: {
    name: "Telegram · tus avisos",
    keys: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
    unlocks: "Avisos a tu móvil y órdenes al agente de ventas",
  },
  server: {
    name: "Servidor público (Vercel)",
    keys: ["PUBLIC_BASE_URL", "VAPI_WEBHOOK_SECRET"],
    unlocks: "Recibir llamadas reales, reservar en la agenda durante la llamada",
  },
  supabase: {
    name: "Supabase · base de datos",
    keys: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    unlocks: "Guardar llamadas y panel web de las clínicas (sin esto, el panel va en modo demo)",
  },
  email: {
    name: "Resend · email",
    keys: ["RESEND_API_KEY", "EMAIL_FROM"],
    unlocks: "Avisos por email a las clínicas",
  },
  sheets: {
    name: "Google Sheets · costes",
    keys: ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_KEY", "GOOGLE_SHEETS_ID"],
    unlocks: "Hoja de clientes y costes en tiempo real",
  },
  calendar: {
    name: "Google Calendar · agenda",
    keys: ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_KEY", "GOOGLE_CALENDAR_ID"],
    unlocks: "Consultar huecos y reservar citas durante la llamada",
  },
  places: {
    name: "Google Places · búsqueda de clínicas",
    keys: ["GOOGLE_PLACES_API_KEY"],
    unlocks: "Agente de ventas",
  },
  sms: {
    name: "Twilio · SMS",
    keys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"],
    unlocks: "Recordatorios de cita por SMS",
  },
  whatsapp: {
    name: "WhatsApp Business (Meta)",
    keys: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_REMINDER_TEMPLATE"],
    unlocks: "Recordatorios de cita por WhatsApp",
  },
  outboundCall: {
    name: "Vapi · llamadas salientes",
    keys: ["VAPI_API_KEY", "VAPI_PHONE_NUMBER_ID"],
    unlocks: "Recordatorios de cita por llamada",
  },
  cron: {
    name: "Tareas programadas (Vercel Cron)",
    keys: ["CRON_SECRET"],
    unlocks: "Envío diario automático de recordatorios",
  },
} as const;

export type IntegrationId = keyof typeof INTEGRATIONS;

const hasValue = (key: string) => Boolean(process.env[key]?.trim());

export function isEnabled(id: IntegrationId): boolean {
  return INTEGRATIONS[id].keys.every(hasValue);
}

export function missingKeys(id: IntegrationId): string[] {
  return INTEGRATIONS[id].keys.filter((k) => !hasValue(k));
}

/** Lee una variable obligatoria (lanza un error claro si falta). */
export function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Falta la variable ${key}`);
  return value;
}

/** Error de "servicio no conectado": los agentes lo tratan como "saltado", no como fallo. */
export class NotConfiguredError extends Error {
  constructor(id: IntegrationId) {
    super(`${INTEGRATIONS[id].name} no está conectado (faltan: ${missingKeys(id).join(", ")})`);
    this.name = "NotConfiguredError";
  }
}

export function assertEnabled(id: IntegrationId) {
  if (!isEnabled(id)) throw new NotConfiguredError(id);
}
