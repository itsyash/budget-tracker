// Optional one-off: bulk-insert SAMPLE entries for the first account.
// Edit ENTRIES as you like, then run:  npx tsx prisma/add-entries.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Entry = {
  daysAgo: number;
  type: "expense" | "income" | "lending" | "repayment";
  amount: number;
  category: string | null;
  bucket: "Needs" | "Wants" | "Savings" | null;
  description: string | null;
  notes: string | null;
};

const ENTRIES: Entry[] = [
  { daysAgo: 0, type: "expense", amount: 500, category: "Groceries & Vegetables", bucket: "Needs", description: null, notes: "Sample groceries" },
  { daysAgo: 0, type: "expense", amount: 1000, category: "Petrol / Fuel", bucket: "Needs", description: null, notes: "Sample fuel" },
];

async function resolveCategoryId(userId: number, name: string | null, bucket: string | null): Promise<number | null> {
  if (!name) return null;
  const existing = await prisma.category.findFirst({ where: { userId, name } });
  if (existing) return existing.id;
  const created = await prisma.category.create({ data: { userId, name, defaultBucket: bucket ?? "Needs", kind: "expense" } });
  return created.id;
}

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!user) { console.log("No account yet. Register at /register first, then re-run."); return; }

  for (const e of ENTRIES) {
    const d = new Date();
    d.setDate(d.getDate() - e.daysAgo);
    d.setHours(12, 0, 0, 0);
    const categoryId = e.type === "expense" || e.type === "income" ? await resolveCategoryId(user.id, e.category, e.bucket) : null;
    await prisma.transaction.create({ data: { userId: user.id, date: d, type: e.type, categoryId, bucket: e.bucket, description: e.description, amount: e.amount, notes: e.notes } });
    console.log(`+ ${e.type} ₹${e.amount} ${e.category ?? ""}`);
  }
  console.log(`Done — added ${ENTRIES.length} sample entries for ${user.email}.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
