/**
 * Contenido centralizado de la landing.
 * Las cifras son orientativas (placeholders de marketing) y deben validarse
 * con datos reales o fuentes citables antes de publicar.
 */

export const BRAND = {
  name: "Atendo",
  slogan: "Tus manos, ocupadas. Tu teléfono, atendido.",
  email: "hola@atendo.ai",
} as const;

export const NAV_LINKS = [
  { href: "#problema", label: "El problema" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#sectores", label: "Sectores" },
  { href: "#roi", label: "Calculadora" },
  { href: "#comparativa", label: "Comparativa" },
] as const;

export type Speaker = "ai" | "caller";
export interface DialogLine {
  speaker: Speaker;
  text: string;
}

export interface DemoScenario {
  id: string;
  label: string;
  business: string;
  lines: DialogLine[];
  summary: { label: string; value: string }[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "dental",
    label: "Clínica dental",
    business: "Clínica Dental Sonríe",
    lines: [
      { speaker: "ai", text: "Clínica Dental Sonríe, le atiende Atendo. ¿En qué puedo ayudarle?" },
      { speaker: "caller", text: "Hola, me duele una muela desde ayer y querría que me vieran pronto." },
      { speaker: "ai", text: "Lo siento mucho. Tengo un hueco mañana a las diez y media con la doctora Martín. ¿Le va bien?" },
      { speaker: "caller", text: "Perfecto, mañana a las diez y media." },
      { speaker: "ai", text: "Hecho. ¿Me confirma su nombre? Le envío un SMS con la cita y la dirección." },
      { speaker: "caller", text: "Laura Gómez. Muchas gracias." },
    ],
    summary: [
      { label: "Paciente", value: "Laura Gómez · Nueva" },
      { label: "Motivo", value: "Dolor molar · Urgencia" },
      { label: "Cita", value: "Mañana 10:30 · Dra. Martín" },
    ],
  },
  {
    id: "fisio",
    label: "Fisioterapia",
    business: "FisioActiva",
    lines: [
      { speaker: "ai", text: "FisioActiva, buenas tardes. Soy el asistente del centro, ¿en qué le ayudo?" },
      { speaker: "caller", text: "Quería cambiar mi sesión del jueves, no puedo ir por la tarde." },
      { speaker: "ai", text: "Sin problema. El jueves tengo libre a las nueve de la mañana, o el viernes a las cinco. ¿Cuál prefiere?" },
      { speaker: "caller", text: "El viernes a las cinco, mejor." },
      { speaker: "ai", text: "Listo, su sesión queda movida al viernes a las cinco con Javier. ¡Hasta el viernes!" },
    ],
    summary: [
      { label: "Paciente", value: "Carlos Ruiz · Recurrente" },
      { label: "Acción", value: "Cambio de cita" },
      { label: "Nueva cita", value: "Viernes 17:00 · Javier" },
    ],
  },
];

export const TRUST_BADGES = [
  "RGPD · Datos en la UE",
  "Responde al 1er tono",
  "Activo en 48 h",
  "Sin permanencia",
] as const;

export const PAIN_STATS = [
  {
    value: "~35%",
    label: "de las llamadas a clínicas quedan sin contestar en horario de consulta",
  },
  {
    value: "8 de 10",
    label: "pacientes nuevos no dejan mensaje: llaman directamente a otra clínica",
  },
  {
    value: "+2.400 €",
    label: "al mes en primeras visitas perdidas en una clínica media",
  },
] as const;

export const STEPS = [
  {
    title: "Desvío inteligente",
    description:
      "Configuras un desvío condicional: si no descuelgas en 3 tonos, la llamada pasa a Atendo. Tu número de siempre, sin cambiar nada.",
  },
  {
    title: "La IA atiende y agenda",
    description:
      "Habla con naturalidad, entiende urgencias, consulta tu agenda y reserva, cambia o cancela citas como lo haría tu mejor recepcionista.",
  },
  {
    title: "Resumen en tu móvil",
    description:
      "Al colgar recibes un resumen al instante por WhatsApp o email: quién llamó, qué necesitaba y qué se ha agendado.",
  },
] as const;

export type VerticalId = "salud" | "estetica" | "hosteleria" | "talleres";

export interface Vertical {
  id: VerticalId;
  tab: string;
  featured?: boolean;
  headline: string;
  pain: string;
  features: string[];
  metric: { value: string; label: string };
  sample: DialogLine[];
}

export const VERTICALS: Vertical[] = [
  {
    id: "salud",
    tab: "Dental y fisioterapia",
    featured: true,
    headline: "No interrumpas un tratamiento para coger el teléfono",
    pain:
      "Con guantes, en el gabinete o en la camilla, cada llamada sin contestar es un paciente nuevo que reserva en la clínica de al lado.",
    features: [
      "Distingue urgencias de revisiones y prioriza huecos",
      "Agenda primeras visitas, cambios y cancelaciones",
      "Recordatorios por SMS para reducir ausencias",
      "Compatible con tu software de gestión clínica",
    ],
    metric: { value: "x3", label: "más primeras visitas captadas fuera de horario" },
    sample: [
      { speaker: "caller", text: "¿Tenéis cita para una limpieza esta semana?" },
      { speaker: "ai", text: "Sí, el miércoles a las 17:00 o el jueves a las 9:30. ¿Cuál le reservo?" },
    ],
  },
  {
    id: "estetica",
    tab: "Peluquerías y estética",
    headline: "Tijeras en la mano, agenda llena",
    pain:
      "Mientras cortas, tiñes o haces una manicura, el teléfono suena y nadie puede atenderlo sin dejar a la clienta a medias.",
    features: [
      "Reserva por servicio y por profesional",
      "Calcula la duración de cada tratamiento",
      "Ofrece huecos libres tras una cancelación",
      "Responde precios y horarios al momento",
    ],
    metric: { value: "-60%", label: "de interrupciones durante los servicios" },
    sample: [
      { speaker: "caller", text: "Quería mechas y corte con Marta el sábado." },
      { speaker: "ai", text: "Marta tiene libre el sábado a las 10:00, son unas 2 horas. ¿Se lo reservo?" },
    ],
  },
  {
    id: "hosteleria",
    tab: "Hostelería y restauración",
    headline: "Reservas en pleno servicio, sin perder una mesa",
    pain:
      "A las 14:00 y a las 21:30 el equipo está volcado en sala y cocina. Justo cuando más llaman para reservar.",
    features: [
      "Gestiona reservas, turnos y número de comensales",
      "Informa de alérgenos, menú del día y horarios",
      "Lista de espera automática si el local está lleno",
      "Atiende varias llamadas a la vez en hora punta",
    ],
    metric: { value: "100%", label: "de llamadas atendidas en hora punta" },
    sample: [
      { speaker: "caller", text: "Mesa para seis el viernes a las nueve y media, ¿puede ser?" },
      { speaker: "ai", text: "Tengo mesa en terraza a las 21:30 para seis. ¿A nombre de quién la dejo?" },
    ],
  },
  {
    id: "talleres",
    tab: "Talleres e ITV",
    headline: "Manos con grasa, clientes bien atendidos",
    pain:
      "Debajo de un coche no se puede descolgar. Y el cliente que llama para un presupuesto no suele volver a intentarlo.",
    features: [
      "Cita previa para revisión, ITV o diagnosis",
      "Informa del estado de la reparación",
      "Recoge matrícula, modelo y síntomas del vehículo",
      "Avisa al cliente cuando el coche está listo",
    ],
    metric: { value: "24/7", label: "cita previa también en fin de semana" },
    sample: [
      { speaker: "caller", text: "Me ha saltado el testigo del motor, ¿me lo podéis mirar?" },
      { speaker: "ai", text: "Claro. ¿Me dice la matrícula? Mañana a las 8:30 podemos hacerle la diagnosis." },
    ],
  },
];

export const COMPARISON = {
  columns: [
    { id: "receptionist", title: "Recepcionista", subtitle: "Contratación tradicional" },
    { id: "none", title: "No contestar", subtitle: "Lo que pasa hoy" },
    { id: "atendo", title: "Atendo", subtitle: "Recepcionista con IA", highlight: true },
  ],
  rows: [
    { label: "Coste mensual", values: ["1.800–2.200 €", "0 € (y clientes perdidos)", "Desde 149 €"] },
    { label: "Disponibilidad", values: ["Horario laboral", "—", "24/7, 365 días"] },
    { label: "Varias llamadas a la vez", values: [false, false, true] },
    { label: "Agenda directamente en tu calendario", values: [true, false, true] },
    { label: "Vacaciones, bajas y fines de semana", values: [false, false, true] },
    { label: "Resumen instantáneo en tu móvil", values: [false, false, true] },
    { label: "Puesta en marcha", values: ["Semanas", "—", "48 horas"] },
  ] as { label: string; values: (string | boolean)[] }[],
};

export const SECTOR_OPTIONS = [
  "Clínica dental",
  "Fisioterapia",
  "Peluquería / Estética",
  "Hostelería / Restauración",
  "Taller mecánico / ITV",
  "Otro",
] as const;
