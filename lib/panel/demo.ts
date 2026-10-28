import type { CallRecord } from "@/lib/db/types";

/**
 * Datos de ejemplo para el panel cuando Supabase no está conectado.
 * Los cambios ("marcar como gestionada") se guardan solo en memoria.
 */

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const base = {
  clinicId: "demo",
  endedReason: "assistant-ended-call",
  recordingUrl: null,
};

const DEMO_CALLS: CallRecord[] = [
  {
    ...base,
    id: "demo-1",
    vapiCallId: "demo-1",
    callerNumber: "+34600111222",
    startedAt: ago(14),
    endedAt: ago(12),
    durationSeconds: 95,
    costUsd: 0.12,
    handledAt: null,
    createdAt: ago(12),
    transcript: `AI: ¡Hola! Clínica Dental Sonríe, soy Lucía, la asistente virtual. Dígame, ¿en qué le puedo ayudar?
User: Hola, mira, es que llevo desde ayer con un dolor de muela que no puedo más.
AI: Lo siento mucho, eso duele bastante. ¿Ha venido alguna vez a la clínica?
User: No, es la primera vez.
AI: De acuerdo. ¿Me dice su nombre, por favor?
User: Javier Moreno.
AI: Muy bien, Javier. ¿Tiene la cara hinchada o fiebre?
User: No, no, solo el dolor, sobre todo al masticar.
AI: Lo dejo marcado como urgente para que le vean hoy o mañana a primera hora. ¿Le viene mejor por la mañana o por la tarde?
User: Por la tarde, que por la mañana trabajo.
AI: ¿Este número desde el que llama es el mejor para contactarle?
User: Sí, este mismo.
AI: Le dejo anotada una visita de urgencia por dolor de muela, por la tarde, y la clínica le llamará con prioridad. Que se mejore, un saludo.`,
    summary: {
      tipo: "urgencia",
      urgencia: "alta",
      pacienteNombre: "Javier Moreno",
      pacienteNuevo: true,
      telefonoContacto: "+34600111222",
      motivo: "Dolor de muela al masticar desde ayer",
      preferenciaHoraria: "Por la tarde",
      accionRequerida: "Llamar hoy para darle cita de urgencia por la tarde",
      resumen: "Paciente nuevo con dolor de muela desde ayer, sin hinchazón ni fiebre. Prefiere tarde.",
      pendientes: [],
    },
    quality: {
      puntuacion: 9,
      resolvio: true,
      errores: [],
      sugerenciasGuion: [],
      resumen: "Llamada bien gestionada: detectó la urgencia y confirmó el teléfono.",
    },
  },
  {
    ...base,
    id: "demo-2",
    vapiCallId: "demo-2",
    callerNumber: "+34611222333",
    startedAt: ago(70),
    endedAt: ago(68),
    durationSeconds: 128,
    costUsd: 0.15,
    handledAt: null,
    createdAt: ago(68),
    transcript: `AI: ¡Hola! Clínica Dental Sonríe, soy Lucía, la asistente virtual. Dígame, ¿en qué le puedo ayudar?
User: Buenas, quería pedir cita para una limpieza.
AI: Claro. ¿Ha venido alguna vez a la clínica o sería la primera vez?
User: Ya he ido, sí.
AI: Estupendo. ¿Me dice su nombre, por favor?
User: Marta López.
AI: Muy bien, Marta. ¿Le viene mejor por la mañana o por la tarde?
User: Por la mañana, el jueves si puede ser.
User: Ah, y ¿aceptáis Mapfre?
AI: Eso no lo tengo ahora mismo, pero lo dejo anotado y la clínica se lo confirma.
AI: Le dejo anotada una limpieza el jueves por la mañana y la clínica le confirmará la hora por SMS.`,
    summary: {
      tipo: "cita_nueva",
      urgencia: "baja",
      pacienteNombre: "Marta López",
      pacienteNuevo: false,
      telefonoContacto: "+34611222333",
      motivo: "Limpieza dental",
      preferenciaHoraria: "Jueves por la mañana",
      accionRequerida: "Darle cita para limpieza el jueves por la mañana y confirmar por SMS",
      resumen: "Paciente habitual que quiere una limpieza el jueves por la mañana. Pregunta por Mapfre.",
      pendientes: ["Confirmar si la clínica trabaja con Mapfre"],
    },
    quality: {
      puntuacion: 6,
      resolvio: true,
      errores: [
        {
          gravedad: "grave",
          tipo: "dato_no_confirmado",
          cita: "Le dejo anotada una limpieza el jueves por la mañana",
          explicacion: "No confirmó el teléfono de contacto antes de despedirse.",
        },
      ],
      sugerenciasGuion: ["Recordar en el guion que el teléfono se confirma siempre antes de la despedida."],
      resumen: "Bien en tono, pero no confirmó el teléfono.",
    },
  },
  {
    ...base,
    id: "demo-3",
    vapiCallId: "demo-3",
    callerNumber: "+34622333444",
    startedAt: ago(200),
    endedAt: ago(199),
    durationSeconds: 61,
    costUsd: 0.07,
    handledAt: ago(150),
    createdAt: ago(199),
    transcript: `AI: ¡Hola! Clínica Dental Sonríe, soy Lucía, la asistente virtual. Dígame, ¿en qué le puedo ayudar?
User: Hola, ¿a qué hora abrís por la tarde?
AI: Por la tarde abrimos de cuatro a ocho, de lunes a viernes.
User: Vale, perfecto, gracias.
AI: A usted. ¿Le puedo ayudar en algo más?
User: No, nada más.
AI: Gracias por llamar, que tenga buen día.`,
    summary: {
      tipo: "consulta",
      urgencia: "baja",
      pacienteNombre: null,
      pacienteNuevo: null,
      telefonoContacto: null,
      motivo: "Horario de tarde",
      preferenciaHoraria: null,
      accionRequerida: "Ninguna, consulta resuelta",
      resumen: "Preguntó el horario de tarde y se le respondió.",
      pendientes: [],
    },
    quality: { puntuacion: 10, resolvio: true, errores: [], sugerenciasGuion: [], resumen: "Respuesta correcta y breve." },
  },
  {
    ...base,
    id: "demo-4",
    vapiCallId: "demo-4",
    callerNumber: "+34633444555",
    startedAt: ago(1500),
    endedAt: ago(1498),
    durationSeconds: 102,
    costUsd: 0.12,
    handledAt: ago(1400),
    createdAt: ago(1498),
    transcript: `AI: ¡Hola! Clínica Dental Sonríe, soy Lucía, la asistente virtual. Dígame, ¿en qué le puedo ayudar?
User: Hola, tenía cita el viernes con la doctora Martín pero no voy a poder ir.
AI: Sin problema. ¿Me dice su nombre?
User: Carlos Ruiz.
AI: De acuerdo, Carlos. ¿Quiere que se la cambiemos a otro día o la cancelamos?
User: Cancelarla de momento, ya llamaré.
AI: Muy bien, lo dejo anotado y la clínica la cancela. Gracias por avisar.`,
    summary: {
      tipo: "cancelacion",
      urgencia: "baja",
      pacienteNombre: "Carlos Ruiz",
      pacienteNuevo: false,
      telefonoContacto: "+34633444555",
      motivo: "Cancelar cita del viernes con la Dra. Martín",
      preferenciaHoraria: null,
      accionRequerida: "Cancelar la cita del viernes de Carlos Ruiz con la Dra. Martín",
      resumen: "Cancela su cita del viernes; volverá a llamar para pedir otra.",
      pendientes: [],
    },
    quality: { puntuacion: 9, resolvio: true, errores: [], sugerenciasGuion: [], resumen: "Gestión correcta de la cancelación." },
  },
];

const handledOverrides = new Map<string, string | null>();

export function demoCalls(): CallRecord[] {
  return DEMO_CALLS.map((c) => (handledOverrides.has(c.id) ? { ...c, handledAt: handledOverrides.get(c.id)! } : c));
}

export function setDemoHandled(id: string, handled: boolean) {
  handledOverrides.set(id, handled ? new Date().toISOString() : null);
}
