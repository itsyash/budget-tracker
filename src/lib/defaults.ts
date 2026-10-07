import type { PrismaClient } from "@prisma/client";

type Cat = { name: string; defaultBucket: string; kind?: "income" | "expense" };

// Default category template given to every new user. No personal/financial data.
export const DEFAULT_CATEGORIES: Cat[] = [
  { name: "Salary", defaultBucket: "Income", kind: "income" },
  { name: "Other Income", defaultBucket: "Income", kind: "income" },
  { name: "Home Loan EMI", defaultBucket: "Needs" },
  { name: "Rent / Maintenance", defaultBucket: "Needs" },
  { name: "Groceries & Vegetables", defaultBucket: "Needs" },
  { name: "Milk", defaultBucket: "Needs" },
  { name: "Electricity Bill", defaultBucket: "Needs" },
  { name: "Mobile & Wifi Bills", defaultBucket: "Needs" },
  { name: "Gas Bill / Other Utility", defaultBucket: "Needs" },
  { name: "Mediclaim / Insurance", defaultBucket: "Needs" },
  { name: "Petrol / Fuel", defaultBucket: "Needs" },
  { name: "AI Subscriptions & SaaS", defaultBucket: "Wants" },
  { name: "Dining / Eating Out", defaultBucket: "Wants" },
  { name: "Shopping", defaultBucket: "Wants" },
  { name: "Entertainment", defaultBucket: "Wants" },
  { name: "Travel / Leisure", defaultBucket: "Wants" },
  { name: "Mutual Fund SIP", defaultBucket: "Savings" },
  { name: "Investments / Deposits", defaultBucket: "Savings" },
  { name: "Miscellaneous", defaultBucket: "Needs" },
];

// Create a new user's starter settings + categories. Safe to call repeatedly.
export async function provisionUser(prisma: PrismaClient, userId: number): Promise<void> {
  const existing = await prisma.setting.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.setting.create({ data: { userId, needsPct: 50, wantsPct: 30, savingsPct: 20, currency: "INR" } });
  }
  if ((await prisma.category.count({ where: { userId } })) === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ userId, name: c.name, defaultBucket: c.defaultBucket, kind: c.kind ?? "expense" })),
    });
  }
}
