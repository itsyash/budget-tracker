import { prisma } from "@/lib/prisma";
import { BUCKETS, type Bucket } from "@/lib/constants";

export type BucketStat = { bucket: Bucket; pct: number; target: number; expected: number; actual: number };
export type BudgetSummary = {
  monthLabel: string;
  income: number;
  targetTotal: number;
  expectedTotal: number;
  actualOutflow: number;
  unspent: number;
  buckets: BucketStat[];
};

function monthRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getBudgetSummary(userId: number, ref: Date = new Date()): Promise<BudgetSummary> {
  const { start, end } = monthRange(ref);

  const [setting, incomeAgg, expenseTx, recurring] = await Promise.all([
    prisma.setting.findUnique({ where: { userId } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, type: "income", date: { gte: start, lt: end } } }),
    prisma.transaction.findMany({ where: { userId, type: "expense", date: { gte: start, lt: end } }, select: { bucket: true, amount: true } }),
    prisma.recurringItem.findMany({ where: { userId, active: true }, select: { bucket: true, monthlyExpected: true } }),
  ]);

  const rule: Record<Bucket, number> = {
    Needs: setting?.needsPct ?? 50,
    Wants: setting?.wantsPct ?? 30,
    Savings: setting?.savingsPct ?? 20,
  };
  const income = incomeAgg._sum.amount ?? 0;

  const actual: Record<Bucket, number> = { Needs: 0, Wants: 0, Savings: 0 };
  for (const t of expenseTx) { const b = t.bucket as Bucket; if (b in actual) actual[b] += t.amount; }

  const expected: Record<Bucket, number> = { Needs: 0, Wants: 0, Savings: 0 };
  for (const r of recurring) { const b = r.bucket as Bucket; if (b in expected) expected[b] += r.monthlyExpected; }

  const buckets: BucketStat[] = BUCKETS.map((b) => ({
    bucket: b, pct: rule[b], target: (income * rule[b]) / 100, expected: expected[b], actual: actual[b],
  }));

  const actualOutflow = buckets.reduce((s, x) => s + x.actual, 0);
  const expectedTotal = buckets.reduce((s, x) => s + x.expected, 0);
  const targetTotal = buckets.reduce((s, x) => s + x.target, 0);

  return {
    monthLabel: start.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    income, targetTotal, expectedTotal, actualOutflow, unspent: income - actualOutflow, buckets,
  };
}

export type TrendRange = "7d" | "30d" | "12m";
export type TrendPoint = { label: string; amount: number };

export async function getSpendTrend(userId: number, range: TrendRange, ref: Date = new Date()): Promise<TrendPoint[]> {
  if (range === "12m") {
    const points: TrendPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const agg = await prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, type: "expense", date: { gte: start, lt: end } } });
      points.push({ label: d.toLocaleDateString("en-IN", { month: "short" }), amount: agg._sum.amount ?? 0 });
    }
    return points;
  }

  const days = range === "7d" ? 7 : 30;
  const start = new Date(ref); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
  const end = new Date(ref); end.setHours(23, 59, 59, 999);

  const tx = await prisma.transaction.findMany({ where: { userId, type: "expense", date: { gte: start, lte: end } }, select: { date: true, amount: true } });
  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) { const d = new Date(start); d.setDate(start.getDate() + i); map.set(localDayKey(d), 0); }
  for (const t of tx) { const key = localDayKey(new Date(t.date)); if (map.has(key)) map.set(key, (map.get(key) ?? 0) + t.amount); }

  return Array.from(map.entries()).map(([k, v]) => {
    const d = new Date(k + "T00:00:00");
    return { label: d.toLocaleDateString("en-IN", { day: "2-digit", ...(days > 7 ? { month: "short" } : {}) }), amount: v };
  });
}

export type LendingSummary = { lentTotal: number; repaidTotal: number; outstanding: number };

export async function getLendingSummary(userId: number): Promise<LendingSummary> {
  const [lent, repaid] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, type: "lending" } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, type: "repayment" } }),
  ]);
  const lentTotal = lent._sum.amount ?? 0;
  const repaidTotal = repaid._sum.amount ?? 0;
  return { lentTotal, repaidTotal, outstanding: lentTotal - repaidTotal };
}

export type CategoryExpensesByBucket = Record<Bucket, { name: string; amount: number }[]>;

export async function getCategoryExpensesByBucket(userId: number, ref: Date = new Date()): Promise<CategoryExpensesByBucket> {
  const { start, end } = monthRange(ref);
  const grouped = await prisma.transaction.groupBy({
    by: ["bucket", "categoryId"],
    where: { userId, type: "expense", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const cats = await prisma.category.findMany({ where: { userId }, select: { id: true, name: true } });
  const nameOf = new Map(cats.map((c) => [c.id, c.name]));

  const result: CategoryExpensesByBucket = { Needs: [], Wants: [], Savings: [] };
  for (const g of grouped) {
    const b = g.bucket as Bucket;
    if (!b || !(b in result)) continue;
    const amount = g._sum.amount ?? 0;
    if (amount <= 0) continue;
    result[b].push({ name: g.categoryId != null ? nameOf.get(g.categoryId) ?? "Uncategorized" : "Uncategorized", amount });
  }
  for (const b of BUCKETS) result[b].sort((a, c) => c.amount - a.amount);
  return result;
}
