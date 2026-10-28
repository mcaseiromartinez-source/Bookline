import { after, NextResponse } from "next/server";
import { parseSearchCommand, runSalesSearch } from "@/lib/agents/sales";
import { INTEGRATIONS, isEnabled, type IntegrationId } from "@/lib/integrations";
import { escapeHtml, sendTelegram } from "@/lib/notify/telegram";
import { secretMatches } from "@/lib/webhook-auth";

/**
 * Órdenes por Telegram. Solo acepta mensajes de TU chat (TELEGRAM_CHAT_ID).
 *   /buscar 30 clínicas dentales en Valencia
 *   /estado
 *   /ayuda
 */
export const maxDuration = 300;

const HELP = [
  "<b>Atendo · órdenes</b>",
  "",
  "/buscar 30 clínicas dentales en Valencia",
  "   Busca clínicas, sus contactos públicos y un mensaje de presentación para cada una.",
  "/estado",
  "   Qué servicios están conectados.",
].join("\n");

export async function POST(req: Request) {
  if (!secretMatches(req.headers.get("x-telegram-bot-api-secret-token"), process.env.TELEGRAM_WEBHOOK_SECRET?.trim())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const message = update?.message;
  const text: string = message?.text ?? "";
  const chatId = String(message?.chat?.id ?? "");

  // Ignoramos a cualquiera que no seas tú (respondemos 200 para que Telegram no reintente).
  if (!text || chatId !== process.env.TELEGRAM_CHAT_ID) return NextResponse.json({ ok: true });

  const [command, ...rest] = text.trim().split(/\s+/);
  const args = rest.join(" ");

  if (command === "/buscar") {
    const parsed = parseSearchCommand(args);
    if (!parsed) {
      await sendTelegram("Dime qué buscar. Ejemplo:\n/buscar 30 clínicas dentales en Valencia");
    } else if (!isEnabled("places")) {
      await sendTelegram("✖ Falta conectar Google Places (GOOGLE_PLACES_API_KEY).");
    } else {
      await sendTelegram(`🔎 Buscando ${parsed.count} resultados para «${escapeHtml(parsed.query)}»… Te aviso cuando lo tenga (1-2 minutos).`);
      after(async () => {
        try {
          await runSalesSearch(parsed.query, parsed.count);
        } catch (err) {
          await sendTelegram(`✖ La búsqueda falló: ${escapeHtml(err instanceof Error ? err.message : String(err))}`).catch(() => {});
        }
      });
    }
  } else if (command === "/estado") {
    const lines = (Object.keys(INTEGRATIONS) as IntegrationId[]).map(
      (id) => `${isEnabled(id) ? "✅" : "❌"} ${escapeHtml(INTEGRATIONS[id].name)}`,
    );
    await sendTelegram(["<b>Conexiones</b>", ...lines].join("\n"));
  } else {
    await sendTelegram(HELP);
  }

  return NextResponse.json({ ok: true });
}
