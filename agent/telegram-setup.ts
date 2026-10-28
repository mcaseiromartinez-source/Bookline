/**
 * Conecta tu Telegram con el bot de Atendo.
 *
 *   1. Crea el bot con @BotFather y pega el token en .env.local (TELEGRAM_BOT_TOKEN=...)
 *   2. Abre tu bot en Telegram y envíale cualquier mensaje (por ejemplo "hola")
 *   3. npm run telegram:setup
 *
 * - Guarda tu TELEGRAM_CHAT_ID en .env.local y te envía un mensaje de prueba.
 * - Si hay PUBLIC_BASE_URL (web publicada), activa las órdenes por Telegram
 *   (/buscar, /estado) apuntando el bot a nuestro servidor.
 */
import { randomBytes } from "node:crypto";
import { sendTelegram } from "@/lib/notify/telegram";
import { ENV_FILE, loadEnv, setEnvVar } from "./env-file";

loadEnv();
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const api = (method: string) => `https://api.telegram.org/bot${token}/${method}`;

if (!token) {
  console.error("\n✖ Falta TELEGRAM_BOT_TOKEN en .env.local. Créalo con @BotFather en Telegram.\n");
  process.exit(1);
}

async function findChatId(): Promise<string> {
  const res = await fetch(api("getUpdates"));
  const data = (await res.json()) as {
    ok: boolean;
    description?: string;
    result?: { message?: { chat: { id: number; first_name?: string; title?: string } } }[];
  };
  if (!data.ok) throw new Error(`Telegram rechazó la petición: ${data.description ?? res.status}`);

  const chat = [...(data.result ?? [])].reverse().find((u) => u.message)?.message?.chat;
  if (!chat) throw new Error("No encuentro mensajes. Abre tu bot en Telegram, envíale «hola» y vuelve a ejecutar esto.");
  console.log(`  Chat encontrado: ${chat.first_name ?? chat.title ?? chat.id}`);
  return String(chat.id);
}

async function main() {
  if (!process.env.TELEGRAM_CHAT_ID?.trim()) {
    setEnvVar("TELEGRAM_CHAT_ID", await findChatId());
  }
  await sendTelegram("✅ <b>Atendo conectado.</b>\nA partir de ahora te llegarán aquí los avisos.");
  console.log("\n✔ Telegram conectado. Revisa tu móvil: te he enviado un mensaje de prueba.");

  const baseUrl = process.env.PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    console.log("  Órdenes por Telegram (/buscar) sin activar: falta PUBLIC_BASE_URL (cuando publiques la web, repite este comando).\n");
    return;
  }

  let secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    secret = randomBytes(24).toString("hex");
    setEnvVar("TELEGRAM_WEBHOOK_SECRET", secret);
    console.log(`  Generada TELEGRAM_WEBHOOK_SECRET en ${ENV_FILE}. Cópiala también en las variables de Vercel.`);
  }
  const res = await fetch(api("setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: `${baseUrl}/api/telegram/webhook`, secret_token: secret, allowed_updates: ["message"] }),
  });
  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(`No se pudo activar el webhook: ${data.description}`);
  console.log(`  Órdenes por Telegram activadas: escribe /ayuda a tu bot.\n`);
}

main().catch((err) => {
  console.error("\n✖", err instanceof Error ? err.message : err, "\n");
  process.exit(1);
});
