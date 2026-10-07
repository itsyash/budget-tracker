import { Wallet, Target, Layers, TrendingUp, PiggyBank, HandCoins } from "lucide-react";
import { getBudgetSummary, getSpendTrend, getLendingSummary, getCategoryExpensesByBucket } from "@/lib/budget";
import { formatINR, formatPct, pctOf } from "@/lib/format";
import { TX_TYPE_COLOR } from "@/lib/constants";
import { requireUser } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import BenchmarkCard from "@/components/BenchmarkCard";
import BenchmarkBarChart from "@/components/charts/BenchmarkBarChart";
import SpendTrendChart from "@/components/charts/SpendTrendChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const summary = await getBudgetSummary(user.id);
  const [d7, d30, m12, lending, catByBucket] = await Promise.all([
    getSpendTrend(user.id, "7d"), getSpendTrend(user.id, "30d"), getSpendTrend(user.id, "12m"),
    getLendingSummary(user.id), getCategoryExpensesByBucket(user.id),
  ]);

  const { income, targetTotal, expectedTotal, actualOutflow, unspent, buckets } = summary;
  const barData = buckets.map((b) => ({ name: `${b.bucket} (${b.pct}% Rule)`, Target: b.target, Expected: b.expected, Actual: b.actual }));

  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto">
      <PageHeader title="Dashboard" subtitle="Your 50 / 30 / 20 budget health at a glance" badge={summary.monthLabel} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Monthly Income" value={formatINR(income)} hint="Income entries this month" icon={<Wallet size={18} />} />
        <StatCard label="Target Budget" value={formatINR(targetTotal)} hint={`${buckets.map((b) => b.pct).join(" / ")} split`} icon={<Target size={18} />} />
        <StatCard label="Exp Commitments" value={formatINR(expectedTotal)} hint={`${formatPct(pctOf(expectedTotal, income))} of income`} icon={<Layers size={18} />} />
        <StatCard label="Actual Outflow" value={formatINR(actualOutflow)} hint={`${formatPct(pctOf(actualOutflow, income))} of income`} icon={<TrendingUp size={18} />} />
        <StatCard label="Unspent Cash" value={formatINR(unspent)} hint={`${formatPct(pctOf(unspent, income))} cash`} icon={<PiggyBank size={18} />} valueColor="var(--orange)" />
        <StatCard label="Outstanding Lent" value={formatINR(lending.outstanding)} hint={`${formatINR(lending.lentTotal)} lent − ${formatINR(lending.repaidTotal)} back`} icon={<HandCoins size={18} />} valueColor={TX_TYPE_COLOR.lending} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4"><h3 className="font-bold">Benchmark vs Expected vs Actual</h3><p className="muted text-xs mt-0.5">Target vs Expected vs Actual amounts</p></div>
          <BenchmarkBarChart data={barData} />
        </div>
        <div className="card p-5 lg:col-span-3"><SpendTrendChart d7={d7} d30={d30} m12={m12} /></div>
      </div>

      <h2 className="font-bold mb-3">Allocation Benchmark Comparison</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {buckets.map((b) => (
          <BenchmarkCard key={b.bucket} bucket={b.bucket} pct={b.pct} target={b.target} expected={b.expected} actual={b.actual} income={income} breakdown={catByBucket[b.bucket]} />
        ))}
      </div>
    </div>
  );
}
