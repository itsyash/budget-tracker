"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { createSession } from "@/lib/auth";

export type FormState = { ok?: boolean; error?: string };

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    const name = String(formData.get("name") || "").trim();
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name: name || null } });
    // refresh the session so the new name shows immediately
    await createSession({ id: updated.id, email: updated.email, name: updated.name });
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save profile." };
  }
}

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    const needsPct = Number(formData.get("needsPct"));
    const wantsPct = Number(formData.get("wantsPct"));
    const savingsPct = Number(formData.get("savingsPct"));
    const currency = String(formData.get("currency") || "INR").trim() || "INR";

    for (const [label, v] of [["Needs", needsPct], ["Wants", wantsPct], ["Savings", savingsPct]] as const) {
      if (!Number.isFinite(v) || v < 0 || v > 100) throw new Error(`${label} % must be between 0 and 100.`);
    }
    if (Math.round(needsPct + wantsPct + savingsPct) !== 100) throw new Error("Needs + Wants + Savings must add up to 100%.");

    await prisma.setting.upsert({
      where: { userId: user.id },
      update: { needsPct, wantsPct, savingsPct, currency },
      create: { userId: user.id, needsPct, wantsPct, savingsPct, currency },
    });
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save settings." };
  }
}

export async function updateAiSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    const groqApiKey = String(formData.get("groqApiKey") || "").trim();
    const groqModel = String(formData.get("groqModel") || "").trim() || null;
    const update: { groqModel: string | null; groqApiKey?: string } = { groqModel };
    if (groqApiKey) update.groqApiKey = groqApiKey;

    await prisma.setting.upsert({
      where: { userId: user.id },
      update,
      create: { userId: user.id, groqApiKey: groqApiKey || null, groqModel },
    });
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save AI key." };
  }
}
