import { Resend } from "resend";
import { assertEnabled, requireEnv } from "@/lib/integrations";

let resend: Resend | null = null;

/** Envía un email con Resend. `EMAIL_FROM` debe ser de un dominio verificado en Resend. */
export async function sendEmail(to: string[], subject: string, html: string): Promise<void> {
  assertEnabled("email");
  if (!to.length) throw new Error("No hay destinatarios para el email");
  resend ??= new Resend(requireEnv("RESEND_API_KEY"));
  const { error } = await resend.emails.send({ from: requireEnv("EMAIL_FROM"), to, subject, html });
  if (error) throw new Error(`Resend: ${error.message}`);
}
