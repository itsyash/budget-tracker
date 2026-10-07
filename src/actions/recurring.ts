"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { BUCKETS, NATURES, type Bucket, type Nature } from "@/lib/constants";

export type FormState = { ok?: boolean; error?: string };

function parse(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const bucketRaw = String(formData.get("bucket") || "");
  const natureRaw = String(formData.get("nature") || "");
  const amount = Number(formData.get("monthlyExpected"));
  const categoryIdRaw = String(formData.get("categoryId") || "");
  const notes = String(formData.get("notes") || "").trim();
  const active = formData.get("active") != null;

  if (!name) throw new Error("Name is required.");
  if (!BUCKETS.includes(bucketRaw as Bucket)) throw new Error("Pick a valid bucket.");
  if (!NATURES.includes(natureRaw as Nature)) throw new Error("Pick a valid nature.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Monthly amount must be greater than 0.");

  return {
    name, bucket: bucketRaw as Bucket, nature: natureRaw as Nature, monthlyExpected: amount,
    categoryId: categoryIdRaw ? Number(categoryIdRaw) : null, notes: notes || null, active,
  };
}

function revalidate() { revalidatePath("/recurring"); revalidatePath("/dashboard"); }

export async function createRecurring(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    await prisma.recurringItem.create({ data: { ...parse(formData), userId: user.id } });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save item." };
  }
}

export async function updateRecurring(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    const id = Number(formData.get("id"));
    if (!id) throw new Error("Missing item id.");
    await prisma.recurringItem.updateMany({ where: { id, userId: user.id }, data: parse(formData) });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not update item." };
  }
}

export async function deleteRecurring(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (id) await prisma.recurringItem.deleteMany({ where: { id, userId: user.id } });
  revalidate();
}
