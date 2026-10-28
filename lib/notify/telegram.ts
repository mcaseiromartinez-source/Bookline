/**
 * Envío de mensajes por Telegram con un bot.
 * Necesita TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID (ver `npm run telegram:setup`).
 */

const MAX_LENGTH = 4096; // límite de Telegram por mensaje

/** Escapa texto para el modo HTML de Telegram. */
export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function sendTelegram(html: string, chatId = process.env.TELEGRAM_CHAT_ID): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) {
    throw new Error("Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID");
  }

  const text = html.length > MAX_LENGTH ? `${html.slice(0, MAX_LENGTH - 20)}\n…(recortado)` : html;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Telegram respondió ${res.status}: ${detail}`);
  }
}

/** Envía un archivo (por ejemplo un CSV) por Telegram. */
export async function sendTelegramDocument(
  filename: string,
  content: string,
  caption?: string,
  chatId = process.env.TELEGRAM_CHAT_ID,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) {
    throw new Error("Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID");
  }
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("document", new Blob([content]), filename);
  if (caption) {
    form.append("caption", caption.slice(0, 1024));
    form.append("parse_mode", "HTML");
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Telegram respondió ${res.status}: ${detail}`);
  }
}
