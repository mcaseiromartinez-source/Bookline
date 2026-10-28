import { NextResponse } from "next/server";
import { bookAppointment, describeSlots, findFreeSlots, type BookInput, type FindSlotsInput } from "@/lib/agents/agenda";
import { resolveClinic, schedulingFor } from "@/lib/clinics";
import { isVapiRequest } from "@/lib/webhook-auth";

/**
 * Herramientas que Lucía usa DURANTE la llamada.
 * Vapi envía { message: { type: "tool-calls", toolCallList: [...] } }
 * y espera { results: [{ toolCallId, result }] }.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const parseArgs = (raw: unknown): Record<string, any> => {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return (raw as Record<string, any>) ?? {};
};

export async function POST(req: Request) {
  if (!isVapiRequest(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const msg = body?.message;
  const toolCalls: any[] = msg?.toolCallList ?? msg?.toolWithToolCallList?.map((t: any) => t.toolCall) ?? [];
  if (msg?.type !== "tool-calls" || !toolCalls.length) return NextResponse.json({ results: [] });

  const clinic = await resolveClinic(msg.assistant?.id ?? msg.call?.assistantId ?? null);
  const backend = schedulingFor(clinic);

  const results = await Promise.all(
    toolCalls.map(async (call) => {
      const name: string = call.function?.name ?? call.name;
      const args = parseArgs(call.function?.arguments ?? call.arguments);
      let result: string;
      try {
        if (!backend) {
          result = "La agenda no está disponible ahora mismo. Toma los datos de la solicitud y di que la clínica le confirmará la hora.";
        } else if (name === "consultar_huecos") {
          const found = await findFreeSlots(args as FindSlotsInput, clinic.config, backend);
          result = describeSlots(found, clinic.config);
        } else if (name === "reservar_cita") {
          result = await bookAppointment(args as BookInput, {
            clinic: clinic.config,
            clinicId: clinic.id,
            backend,
            vapiCallId: msg.call?.id ?? null,
          });
        } else {
          result = `Herramienta desconocida: ${name}`;
        }
      } catch (err) {
        console.error(`[herramienta ${name}] error:`, err);
        result =
          "Ha habido un problema técnico con la agenda. Discúlpate, toma los datos de la solicitud y di que la clínica le llamará para confirmar la hora.";
      }
      return { toolCallId: call.id, result };
    }),
  );

  return NextResponse.json({ results });
}
