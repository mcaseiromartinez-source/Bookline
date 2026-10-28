/**
 * Crea o actualiza el asistente en Vapi.
 *
 *   npm run agent:sync
 *
 * - Lee VAPI_API_KEY de .env.local (nunca se sube a GitHub).
 * - Si no hay VAPI_ASSISTANT_ID, crea el asistente y guarda su id en .env.local.
 * - Si ya existe, lo actualiza con el guion y la configuración actuales.
 * - Si hay PUBLIC_BASE_URL, conecta el asistente con nuestro webhook para que
 *   los agentes reciban cada llamada terminada.
 */
import { randomBytes } from "node:crypto";
import { isEnabled } from "@/lib/integrations";
import { buildAssistant, type ServerOptions } from "./assistant";
import { ENV_FILE, loadEnv, setEnvVar } from "./env-file";

const API = "https://api.vapi.ai";

loadEnv();

const apiKey = process.env.VAPI_API_KEY?.trim();
const assistantId = process.env.VAPI_ASSISTANT_ID?.trim();
const baseUrl = process.env.PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");

if (!apiKey) {
  console.error(
    `\n✖ Falta VAPI_API_KEY.\n  Copia .env.example como ${ENV_FILE} y pega tu clave privada de Vapi (dashboard.vapi.ai → API Keys).\n`,
  );
  process.exit(1);
}

function serverOptions(): ServerOptions | undefined {
  if (!baseUrl) return undefined;
  let secret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  if (!secret) {
    secret = randomBytes(24).toString("hex");
    setEnvVar("VAPI_WEBHOOK_SECRET", secret);
    console.log(`  Generada VAPI_WEBHOOK_SECRET en ${ENV_FILE}. Cópiala también en las variables de Vercel.`);
  }
  return { baseUrl, secret, booking: isEnabled("calendar") };
}

async function main() {
  const server = serverOptions();
  const body = buildAssistant(server);
  const url = assistantId ? `${API}/assistant/${assistantId}` : `${API}/assistant`;
  const res = await fetch(url, {
    method: assistantId ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: unknown };
  if (!res.ok) {
    console.error(`\n✖ Vapi respondió ${res.status}:`, JSON.stringify(data.message ?? data, null, 2));
    if (res.status === 401) console.error("  Revisa que VAPI_API_KEY sea la clave PRIVADA, no la pública.");
    if (res.status === 404 && assistantId) console.error(`  El VAPI_ASSISTANT_ID no existe en esta cuenta: bórralo de ${ENV_FILE} y vuelve a ejecutar.`);
    process.exit(1);
  }

  if (!assistantId && data.id) {
    setEnvVar("VAPI_ASSISTANT_ID", data.id);
    console.log(`\n✔ Asistente creado: ${body.name}`);
    console.log(`  Id guardado en ${ENV_FILE}. Las próximas veces se actualizará en lugar de crear otro.`);
  } else {
    console.log(`\n✔ Asistente actualizado: ${body.name}`);
  }
  console.log(
    server
      ? `  Webhook conectado: ${server.baseUrl}/api/vapi/webhook`
      : "  Webhook sin conectar (falta PUBLIC_BASE_URL): los agentes aún no reciben las llamadas.",
  );
  console.log(
    server?.booking
      ? "  Agenda conectada: Lucía puede consultar huecos y reservar citas."
      : "  Agenda sin conectar: Lucía toma la solicitud y la clínica confirma la hora.",
  );
  console.log(`  Pruébalo: https://dashboard.vapi.ai/assistants/${data.id ?? assistantId} → botón "Talk to Assistant"\n`);
}

main().catch((err) => {
  console.error("\n✖ No se pudo conectar con Vapi:", err instanceof Error ? err.message : err);
  process.exit(1);
});
