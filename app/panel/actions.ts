"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/db/session";
import { isDemoMode, setHandled } from "@/lib/panel/data";

export async function toggleHandled(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const handled = formData.get("handled") === "true";
  if (!id) return;
  await setHandled(id, handled);
  revalidatePath("/panel", "layout");
}

export async function signOut() {
  if (!isDemoMode()) {
    const db = await createSessionClient();
    await db.auth.signOut();
  }
  redirect("/panel/login");
}
