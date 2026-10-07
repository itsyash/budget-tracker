"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { BUCKETS, TX_TYPES, type Bucket, type TxType } from "@/lib/constants";

export type FormState = { ok?: boolean; error?: string; andNext?: boolean };

function parseTx(formData: FormData) {
  const type = String(formData.get("type") || "") as TxType;
  const dateStr = String(formData.get("date") || "");
  const amount = Number(formData.get("amount"));
  const categoryIdRaw = String(formData.get("categoryId") || "");
  const bucketRaw = String(formData.get("bucket") || "");
  const description = String(formData.get("description") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!TX_TYPES.includes(type)) throw new Error("Invalid entry type.");
  if (!dateStr) throw new Error("Date is required.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than 0.");

  const bucket: Bucket | null = type === "expense" ? (BUCKETS.includes(bucketRaw as Bucket) ? (bucketRaw as Bucket) : null) : null;
  if (type === "expense" && !bucket) throw new Error("Pick a budget bucket for an expense.");

  return {
    type, date: new Date(dateStr + "T12:00:00"), amount,
    categoryId: categoryIdRaw ? Number(categoryIdRaw) : null,
    bucket, description: description || null, notes: notes || null,
  };
}

function revalidate() { revalidatePath("/transactions"); revalidatePath("/dashboard"); }

export async function createTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    const data = parseTx(formData);
    await prisma.transaction.create({ data: { ...data, userId: user.id } });
    revalidate();
    return { ok: true, andNext: formData.get("andNext") === "1" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save entry." };
  }
}

export async function updateTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    const id = Number(formData.get("id"));
    if (!id) throw new Error("Missing entry id.");
    const data = parseTx(formData);
    await prisma.transaction.updateMany({ where: { id, userId: user.id }, data });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not update entry." };
  }
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (id) await prisma.transaction.deleteMany({ where: { id, userId: user.id } });
  revalidate();
}
