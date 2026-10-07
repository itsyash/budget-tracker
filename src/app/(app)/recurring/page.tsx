import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { BUCKETS, type Bucket } from "@/lib/constants";
import { requireUser } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import BucketBadge from "@/components/BucketBadge";
import DeleteButton from "@/components/DeleteButton";
import RecurringFilterBar from "@/components/RecurringFilterBar";
import RecurringForm from "@/components/forms/RecurringForm";
import { deleteRecurring } from "@/actions/recurring";

export const dynamic = "force-dynamic";
type SP = { categoryId?: string; bucket?: string; nature?: string; status?: string };

export default async function RecurringPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const categoryId = sp.categoryId ?? ""; const bucket = sp.bucket ?? ""; const nature = sp.nature ?? ""; const status = sp.status ?? "";
  const hasFilter = !!(categoryId || bucket || nature || status);

  const where: Prisma.RecurringItemWhereInput = { userId: user.id };
  if (categoryId) where.categoryId = Number(categoryId);
  if (bucket) where.bucket = bucket;
  if (nature) where.nature = nature;
  if (status === "active") where.active = true;
  if (status === "paused") where.active = false;

  const [items, categories] = await Promise.all([
    prisma.recurringItem.findMany({ where, orderBy: [{ bucket: "asc" }, { monthlyExpected: "desc" }], include: { category: true } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);
  const cats = categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));

  const byBucket: Record<Bucket, number> = { Needs: 0, Wants: 0, Savings: 0 };
  for (const i of items) if (i.active && i.bucket in byBucket) byBucket[i.bucket as Bucket] += i.monthlyExpected;
  const grand = BUCKETS.reduce((s, b) => s + byBucket[b], 0);

  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto">
      <PageHeader title="Recurring & SIPs" subtitle="Planned monthly commitments — feeds the “Expected” column on the dashboard" actions={<RecurringForm categories={cats} />} />
      <RecurringFilterBar categories={cats} current={{ categoryId, bucket, nature, status }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4"><div className="muted text-xs font-semibold uppercase">Total{hasFilter ? " (filtered)" : ""}</div><div className="text-xl font-bold mt-1">{formatINR(grand)}</div></div>
        {BUCKETS.map((b) => (<div key={b} className="card p-4"><div className="muted text-xs font-semibold uppercase">{b}</div><div className="text-xl font-bold mt-1">{formatINR(byBucket[b])}</div></div>))}
      </div>
      <div className="card overflow-hidden"><div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>Item</th><th>Category</th><th>Bucket</th><th className="text-right">Monthly Expected</th><th>Nature</th><th>Status</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={8} className="text-center muted py-10">{hasFilter ? "No items match these filters." : "No recurring items yet."}</td></tr>}
            {items.map((i) => (
              <tr key={i.id}>
                <td className="font-medium">{i.name}</td>
                <td className="whitespace-nowrap">{i.category?.name ?? <span className="muted">—</span>}</td>
                <td><BucketBadge bucket={i.bucket} /></td>
                <td className="text-right font-semibold whitespace-nowrap">{formatINR(i.monthlyExpected)}</td>
                <td><span className="badge">{i.nature}</span></td>
                <td>{i.active ? <span className="accent text-xs font-semibold">Active</span> : <span className="muted text-xs">Paused</span>}</td>
                <td className="muted text-xs max-w-[160px] truncate">{i.notes}</td>
                <td><div className="flex items-center gap-1 justify-end"><RecurringForm categories={cats} initial={{ id: i.id, name: i.name, categoryId: i.categoryId, bucket: i.bucket, monthlyExpected: i.monthlyExpected, nature: i.nature, notes: i.notes, active: i.active }} /><DeleteButton action={deleteRecurring} id={i.id} message="Delete this recurring item?" /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
