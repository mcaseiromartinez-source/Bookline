/**
 * Datos de la clínica que el agente conoce.
 * Clínica de prueba ficticia: cambia estos datos por los de un cliente real.
 */

export interface Treatment {
  name: string;
  /** Precio orientativo que el agente puede decir. `null` = "se valora en consulta". */
  priceFrom: number | null;
  durationMin: number;
}

export interface Clinic {
  name: string;
  assistantName: string;
  address: string;
  hours: string;
  phoneForHumans: string;
  doctors: string[];
  treatments: Treatment[];
  firstVisit: string;
  payment: string;
  extraInfo: string[];
}

export const CLINIC: Clinic = {
  name: "Clínica Dental Sonríe",
  assistantName: "Lucía",
  address: "Calle Mayor 24, primera planta, Madrid. A dos minutos del metro Sol.",
  hours: "Lunes a viernes de 9:00 a 14:00 y de 16:00 a 20:00. Sábados, domingos y festivos, cerrado.",
  phoneForHumans: "91 000 00 00",
  doctors: [
    "Doctora Ana Martín, odontología general y estética",
    "Doctor Pablo Ruiz, ortodoncia e implantes",
  ],
  treatments: [
    { name: "Primera visita con revisión y diagnóstico", priceFrom: 0, durationMin: 30 },
    { name: "Limpieza dental", priceFrom: 50, durationMin: 45 },
    { name: "Empaste", priceFrom: 60, durationMin: 45 },
    { name: "Endodoncia", priceFrom: 180, durationMin: 60 },
    { name: "Blanqueamiento", priceFrom: 250, durationMin: 60 },
    { name: "Ortodoncia invisible", priceFrom: null, durationMin: 45 },
    { name: "Implantes", priceFrom: null, durationMin: 60 },
    { name: "Urgencia dental (dolor, rotura, inflamación)", priceFrom: 40, durationMin: 30 },
  ],
  firstVisit: "La primera visita es gratuita e incluye revisión, radiografía si hace falta y presupuesto sin compromiso.",
  payment: "Se puede pagar con tarjeta, efectivo o Bizum, y hay financiación sin intereses hasta 12 meses.",
  extraInfo: [
    "Trabajamos con las principales mutuas: Sanitas, Adeslas y DKV.",
    "Hay parking público en la Plaza Mayor, a 3 minutos andando.",
  ],
};
