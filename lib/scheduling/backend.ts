/**
 * "Enchufe" para el programa de agenda de cada clínica.
 * Hoy hay una implementación (Google Calendar). Para conectar el programa de
 * gestión de una clínica (Gesden, Clinic Cloud, Doctoralia…) basta con escribir
 * otra clase que cumpla esta interfaz; el resto del sistema no cambia.
 */

export interface Interval {
  start: Date;
  end: Date;
}

export interface NewEvent {
  start: Date;
  end: Date;
  title: string;
  description: string;
  timezone: string;
}

export interface SchedulingBackend {
  readonly name: string;
  /** Intervalos ocupados entre `from` y `to`. */
  busy(from: Date, to: Date): Promise<Interval[]>;
  /** Crea la cita y devuelve su identificador en el programa de la clínica. */
  createEvent(event: NewEvent): Promise<string>;
}
