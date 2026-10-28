import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertEnabled } from "@/lib/integrations";

/**
 * Cliente de Supabase con la clave de servicio: salta las reglas de seguridad.
 * SOLO para el servidor (agentes, webhooks, tareas programadas). Nunca en el navegador.
 */
let admin: SupabaseClient | null = null;

export function getAdminDb(): SupabaseClient {
  assertEnabled("supabase");
  admin ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
