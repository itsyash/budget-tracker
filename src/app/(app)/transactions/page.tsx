import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { TX_TYPE_LABEL, TX_TYPE_COLOR, type TxType } from "@/lib/constants";
import { requireUser } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import BucketBadge from "@/components/BucketBadge";
import DeleteButton from "@/components/DeleteButton";
import FilterBar from "@/components/FilterBar";
import TransactionForm from "@/components/forms/TransactionForm";
import { deleteTransaction } from "@/actions/transactions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
const SIGN: Record<string, string> = { income: "+ ", repayment: "+ ", lending: "− ", expense: "" };
type SP = { type?: string; from?: string; to?: string; categoryId?: string; bucket?: string };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const type = sp.type ?? ""; const from = sp.from ?? ""; const to = sp.to ?? "";
  const categoryId = sp.categoryId ?? ""; const bucket = sp.bucket ?? "";
  const hasFilter = !!(type || from || to || categoryId || bucket);

  const where: Prisma.TransactionWhereInput = { userId: user.id };
  if (type) where.type = type;
  if (from || to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (from) dateFilter.gte = new Date(from + "T00:00:00");
    if (to) dateFilter.lte = new Date(to + "T23:59:59.999");
    where.date = dateFilter;
  }
  if (categoryId) where.categoryId = Number(categoryId);
  if (bucket) where.bucket = bucket;

  const [txs, categories] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: [{ date: "desc" }, { id: "desc" }], include: { category: true } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);
  const catsForm = categories.map((c) => ({ id: c.id, name: c.name, defaultBucket: c.defaultBucket, kind: c.kind }));
  const catsFilter = categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));

  const incomeTotal = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenseTotal = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const lentTotal = txs.filter((t) => t.type === "lending").reduce((s, t) => s + t.amount, 0);
  const repaidTotal = txs.filter((t) => t.type === "repayment").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto">
      <PageHeader title="Daily Log" subtitle="Every income, expense, and lending entry" actions={<TransactionForm categories={catsForm} />} />
      <FilterBar categories={catsFilter} current={{ type, from, to, categoryId, bucket }} />

      <div className="card p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <span className="muted text-sm">{txs.length} {txs.length === 1 ? "entry" : "entries"}{hasFilter ? " · filtered" : ""}</span>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="muted">Income <b className="ml-1" style={{ color: "var(--accent-2)" }}>{formatINR(incomeTotal)}</b></span>
          <span className="muted">Expenses <b className="ml-1" style={{ color: "var(--text)" }}>{formatINR(expenseTotal)}</b></span>
          <span className="muted">Net <b className="ml-1" style={{ color: "var(--orange)" }}>{formatINR(incomeTotal - expenseTotal)}</b></span>
          {(lentTotal > 0 || repaidTotal > 0) && (<>
            <span className="muted">Lent <b className="ml-1" style={{ color: TX_TYPE_COLOR.lending }}>{formatINR(lentTotal)}</b></span>
            <span className="muted">Repaid <b className="ml-1" style={{ color: TX_TYPE_COLOR.repayment }}>{formatINR(repaidTotal)}</b></span>
          </>)}
        </div>
      </div>

      <div className="card overflow-hidden"><div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Bucket</th><th>Description</th><th className="text-right">Amount</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            {txs.length === 0 && <tr><td colSpan={8} className="text-center muted py-10">{hasFilter ? "No entries match these filters." : "No entries yet. Click “Add Entry” to log your first income or expense."}</td></tr>}
            {txs.map((t) => {
              const color = TX_TYPE_COLOR[t.type as TxType] ?? "#94a3b8";
              const initial = { id: t.id, type: t.type, date: new Date(t.date).toISOString().slice(0, 10), amount: t.amount, categoryId: t.categoryId, bucket: t.bucket, description: t.description, notes: t.notes };
              return (
                <tr key={t.id}>
                  <td className="whitespace-nowrap">{fmtDate(t.date)}</td>
                  <td><span className="badge" style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)` }}>{TX_TYPE_LABEL[t.type as TxType] ?? t.type}</span></td>
                  <td className="whitespace-nowrap">{t.category?.name ?? <span className="muted">—</span>}</td>
                  <td><BucketBadge bucket={t.bucket} /></td>
                  <td>{t.description ?? <span className="muted">—</span>}</td>
                  <td className="text-right font-semibold whitespace-nowrap" style={t.type !== "expense" ? { color } : undefined}>{SIGN[t.type] ?? ""}{formatINR(t.amount)}</td>
                  <td className="muted text-xs max-w-[180px] truncate">{t.notes}</td>
                  <td><div className="flex items-center gap-1 justify-end"><TransactionForm categories={catsForm} initial={initial} /><DeleteButton action={deleteTransaction} id={t.id} message="Delete this entry? This cannot be undone." /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
