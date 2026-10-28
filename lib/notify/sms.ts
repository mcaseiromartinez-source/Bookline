import { assertEnabled, requireEnv } from "@/lib/integrations";

/** Envía un SMS con Twilio (API REST, sin librería). `to` en formato +34… */
export async function sendSms(to: string, body: string): Promise<void> {
  assertEnabled("sms");
  const sid = requireEnv("TWILIO_ACCOUNT_SID");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${requireEnv("TWILIO_AUTH_TOKEN")}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: requireEnv("TWILIO_FROM_NUMBER"), Body: body }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Twilio respondió ${res.status}: ${detail.slice(0, 300)}`);
  }
}
