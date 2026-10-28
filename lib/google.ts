import { JWT } from "google-auth-library";
import { requireEnv } from "@/lib/integrations";

/**
 * Acceso a las APIs de Google (Sheets y Calendar) con una "cuenta de servicio":
 * un usuario robot de Google al que compartes la hoja y el calendario.
 */

const clients = new Map<string, JWT>();

function getJwt(scopes: string[]): JWT {
  const cacheKey = scopes.join(" ");
  let jwt = clients.get(cacheKey);
  if (!jwt) {
    jwt = new JWT({
      email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      // En .env la clave va en una línea con "\n"; aquí recuperamos los saltos de línea reales.
      key: requireEnv("GOOGLE_SERVICE_ACCOUNT_KEY").replace(/\\n/g, "\n"),
      scopes,
    });
    clients.set(cacheKey, jwt);
  }
  return jwt;
}

/** Llamada autenticada a una API de Google. Devuelve el JSON de la respuesta. */
export async function googleFetch<T = unknown>(
  url: string,
  scopes: string[],
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { token } = await getJwt(scopes).getAccessToken();
  if (!token) throw new Error("Google no devolvió un token de acceso");

  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google respondió ${res.status}: ${detail.slice(0, 500)}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const SHEETS_SCOPE = ["https://www.googleapis.com/auth/spreadsheets"];
export const CALENDAR_SCOPE = ["https://www.googleapis.com/auth/calendar"];
