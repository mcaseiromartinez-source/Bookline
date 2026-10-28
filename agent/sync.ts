/**
 * Crea o actualiza el asistente en Vapi.
 *
 *   npm run agent:sync
 *
 * - Lee VAPI_API_KEY de .env.local (nunca se sube a GitHub).
 * - Si no hay VAPI_ASSISTANT_ID, crea el asistente y guarda su id en .env.local.
 * - Si ya existe, lo actualiza con el guion y la configuración actuales.
 */
import { appendFileSync, existsSync } from "node:fs";
import { buildAssistant } from "./assistant";

const ENV_FILE = ".env.local";
const API = "https://api.vapi.ai";

if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const apiKey = process.env.VAPI_API_KEY?.trim();
const assistantId = process.env.VAPI_ASSISTANT_ID?.trim();

if (!apiKey) {
  console.error(
    `\n✖ Falta VAPI_API_KEY.\n  Copia .env.example como ${ENV_FILE} y pega tu clave privada de Vapi (dashboard.vapi.ai → API Keys).\n`,
  );
  process.exit(1);
}

async function main() {
  const body = buildAssistant();
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
    if (res.status === 404 && assistantId) console.error("  El VAPI_ASSISTANT_ID no existe en esta cuenta: bórralo de .env.local y vuelve a ejecutar.");
    process.exit(1);
  }

  if (!assistantId && data.id) {
    appendFileSync(ENV_FILE, `\nVAPI_ASSISTANT_ID=${data.id}\n`);
    console.log(`\n✔ Asistente creado: ${body.name}`);
    console.log(`  Id guardado en ${ENV_FILE}. Las próximas veces se actualizará en lugar de crear otro.`);
  } else {
    console.log(`\n✔ Asistente actualizado: ${body.name}`);
  }
  console.log(`  Pruébalo: https://dashboard.vapi.ai/assistants/${data.id ?? assistantId} → botón "Talk to Assistant"\n`);
}

main().catch((err) => {
  console.error("\n✖ No se pudo conectar con Vapi:", err instanceof Error ? err.message : err);
  process.exit(1);
});
