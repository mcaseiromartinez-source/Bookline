import { after, NextResponse } from "next/server";
import { onCallEnded } from "@/lib/agents";
import { parseVapiEndOfCall } from "@/lib/calls/vapi";
import { isVapiRequest } from "@/lib/webhook-auth";

/**
 * Webhook de Vapi. Vapi llama aquí cuando ocurre algo en una llamada.
 * Solo nos interesa el "end-of-call-report": la llamada ha terminado.
 */

export async function POST(req: Request) {
  if (!isVapiRequest(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const report = parseVapiEndOfCall(body);

  // Otros tipos de aviso (estado de la llamada, etc.): se ignoran.
  if (!report) return NextResponse.json({ ok: true, ignored: true });

  // Respondemos enseguida a Vapi y los agentes trabajan después.
  after(() => onCallEnded(report));
  return NextResponse.json({ ok: true });
}
