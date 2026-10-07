"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export type FormState = { ok?: boolean; error?: string };

function parse(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const defaultBucket = String(formData.get("defaultBucket") || "Needs");
  const kind = String(formData.get("kind") || "expense");
  if (!name) throw new Error("Category name is required.");
  return { name, defaultBucket, kind };
}

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    await prisma.category.create({ data: { ...parse(formData), userId: user.id } });
    revalidatePath("/categories");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique")) return { error: "You already have a category with that name." };
    return { error: e instanceof Error ? e.message : "Could not save category." };
  }
}

export async function updateCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    const id = Number(formData.get("id"));
    if (!id) throw new Error("Missing category id.");
    await prisma.category.updateMany({ where: { id, userId: user.id }, data: parse(formData) });
    revalidatePath("/categories");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not update category." };
  }
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (id) {
    await prisma.transaction.updateMany({ where: { categoryId: id, userId: user.id }, data: { categoryId: null } });
    await prisma.recurringItem.updateMany({ where: { categoryId: id, userId: user.id }, data: { categoryId: null } });
    await prisma.category.deleteMany({ where: { id, userId: user.id } });
  }
  revalidatePath("/categories");
}
