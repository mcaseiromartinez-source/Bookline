import { NextResponse } from "next/server";
import { sendTomorrowReminders } from "@/lib/agents/reminders";
import { secretMatches } from "@/lib/webhook-auth";

/**
 * Tarea diaria (ver vercel.json → crons). Vercel la llama con
 * la cabecera "Authorization: Bearer <CRON_SECRET>".
 */
export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!secretMatches(auth, process.env.CRON_SECRET?.trim())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const run = await sendTomorrowReminders();
    return NextResponse.json({ ok: true, ...run });
  } catch (err) {
    console.error("[cron recordatorios]", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
