/**
 * Da acceso al panel a una persona de la clínica.
 *
 *   npm run panel:usuario -- recepcion@clinica.com
 *
 * Crea el usuario en Supabase con una contraseña temporal, lo asocia a la clínica
 * del asistente actual (VAPI_ASSISTANT_ID) y añade su email a los avisos.
 */
import { randomBytes } from "node:crypto";
import { CLINIC } from "./clinic";
import { getAdminDb } from "@/lib/db/admin";
import { ensureClinic } from "@/lib/db/repo";
import { requireEnv } from "@/lib/integrations";
import { loadEnv } from "./env-file";

loadEnv();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("\nUso: npm run panel:usuario -- recepcion@clinica.com\n");
    process.exit(1);
  }

  const db = getAdminDb();
  const clinic = await ensureClinic(requireEnv("VAPI_ASSISTANT_ID"), CLINIC.name);
  const password = randomBytes(9).toString("base64url");

  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`No se pudo crear el usuario: ${error.message}`);

  const member = await db.from("clinic_members").upsert({ user_id: data.user.id, clinic_id: clinic.id, role: "staff" });
  if (member.error) throw new Error(member.error.message);

  if (!clinic.notifyEmails.includes(email)) {
    const upd = await db.from("clinics").update({ notify_emails: [...clinic.notifyEmails, email] }).eq("id", clinic.id);
    if (upd.error) throw new Error(upd.error.message);
  }

  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";
  console.log(`\n✔ Acceso creado para ${email} (${clinic.name})`);
  console.log(`  Panel: ${base}/panel`);
  console.log(`  Contraseña temporal: ${password}`);
  console.log("  Pásasela por un canal privado y pídele que la cambie.\n");
}

main().catch((err) => {
  console.error("\n✖", err instanceof Error ? err.message : err, "\n");
  process.exit(1);
});
