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

export type BulkTxInput = {
  type: TxType;
  date: string;
  amount: number;
  categoryId: number | null;
  bucket: Bucket | null;
  description: string | null;
  notes: string | null;
};

export type BulkResult = { ok?: boolean; error?: string; count?: number };

export async function bulkCreateTransactions(entries: BulkTxInput[]): Promise<BulkResult> {
  const user = await requireUser();
  try {
    if (!Array.isArray(entries) || entries.length === 0) {
      return { error: "No entries to save." };
    }

    const validRows = entries.filter((e) => Number.isFinite(e.amount) && e.amount > 0 && Boolean(e.date));
    if (validRows.length === 0) {
      return { error: "Please enter at least one valid entry with an amount greater than 0." };
    }

    for (const r of validRows) {
      if (!TX_TYPES.includes(r.type)) throw new Error(`Invalid type: ${r.type}`);
      if (r.type === "expense" && !r.bucket) throw new Error("All expense entries must have a budget bucket (Needs / Wants / Savings).");
    }

    await prisma.transaction.createMany({
      data: validRows.map((r) => ({
        userId: user.id,
        date: new Date(r.date + "T12:00:00"),
        type: r.type,
        amount: Number(r.amount),
        categoryId: r.type === "expense" || r.type === "income" ? (r.categoryId ? Number(r.categoryId) : null) : null,
        bucket: r.type === "expense" ? r.bucket : null,
        description: r.description ? r.description.trim() || null : null,
        notes: r.notes ? r.notes.trim() || null : null,
      })),
    });

    revalidate();
    return { ok: true, count: validRows.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save bulk entries." };
  }
}

