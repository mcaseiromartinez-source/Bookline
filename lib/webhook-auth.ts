import { timingSafeEqual } from "node:crypto";

/** Compara un secreto recibido con el esperado sin filtrar información por tiempos. */
export function secretMatches(received: string | null, expected: string | undefined): boolean {
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Webhooks de Vapi: cabecera x-atendo-secret = VAPI_WEBHOOK_SECRET. */
export const isVapiRequest = (req: Request) =>
  secretMatches(req.headers.get("x-atendo-secret"), process.env.VAPI_WEBHOOK_SECRET?.trim());
