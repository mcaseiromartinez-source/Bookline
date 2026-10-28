import { toCall } from "@/lib/db/repo";
import { createSessionClient } from "@/lib/db/session";
import type { CallRecord } from "@/lib/db/types";
import { dateKey } from "@/lib/time";
import { demoCalls, setDemoHandled } from "./demo";

/**
 * Datos del panel de la clínica.
 * Con Supabase: datos reales, filtrados por las reglas de seguridad (cada usuario ve su clínica).
 * Sin Supabase: modo demostración con llamadas de ejemplo.
 */

export const isDemoMode = () => !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type CallFilter = "pendientes" | "urgentes" | "todas";

export interface Viewer {
  email: string;
  clinicName: string;
}

export async function getViewer(): Promise<Viewer | null> {
  if (isDemoMode()) return { email: "demo@atendo.ai", clinicName: "Clínica Dental Sonríe (demo)" };
  const db = await createSessionClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from("clinics").select("name").order("name");
  const names = (data ?? []).map((c) => c.name as string);
  return { email: user.email ?? "", clinicName: names.join(" · ") || "Sin clínica asignada" };
}

const matches = (c: CallRecord, filter: CallFilter) =>
  filter === "todas" || (!c.handledAt && (filter === "pendientes" || c.summary?.urgencia === "alta"));

export async function listCalls(filter: CallFilter): Promise<CallRecord[]> {
  if (isDemoMode()) return demoCalls().filter((c) => matches(c, filter));

  const db = await createSessionClient();
  let query = db.from("calls").select("*").order("created_at", { ascending: false }).limit(200);
  if (filter !== "todas") query = query.is("handled_at", null);
  if (filter === "urgentes") query = query.eq("urgencia", "alta");
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCall);
}

/** Estadísticas de cabecera (sobre las últimas 200 llamadas). */
export async function getStats() {
  const all = await listCalls("todas");
  const today = dateKey(new Date());
  const scores = all.map((c) => c.quality?.puntuacion).filter((n): n is number => typeof n === "number");
  return {
    today: all.filter((c) => dateKey(new Date(c.createdAt)) === today).length,
    pending: all.filter((c) => !c.handledAt).length,
    urgent: all.filter((c) => !c.handledAt && c.summary?.urgencia === "alta").length,
    quality: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
  };
}

export async function getCall(id: string): Promise<CallRecord | null> {
  if (isDemoMode()) return demoCalls().find((c) => c.id === id) ?? null;
  const db = await createSessionClient();
  const { data } = await db.from("calls").select("*").eq("id", id).maybeSingle();
  return data ? toCall(data) : null;
}

export async function setHandled(id: string, handled: boolean) {
  if (isDemoMode()) return setDemoHandled(id, handled);
  const db = await createSessionClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("Sesión caducada");
  const { error } = await db
    .from("calls")
    .update({ handled_at: handled ? new Date().toISOString() : null, handled_by: handled ? user.id : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
