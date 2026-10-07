import { BUCKETS, TX_TYPES, TX_TYPE_LABEL } from "@/lib/constants";

type Cat = { id: number; name: string; kind: string };

export default function FilterBar({
  categories, current,
}: {
  categories: Cat[];
  current: { type: string; from: string; to: string; categoryId: string; bucket: string };
}) {
  const income = categories.filter((c) => c.kind === "income");
  const expense = categories.filter((c) => c.kind === "expense");
  const hasFilter = !!(current.type || current.from || current.to || current.categoryId || current.bucket);

  return (
    <form method="get" action="/transactions" className="card p-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <div>
          <label className="label">Type</label>
          <select className="select" name="type" defaultValue={current.type}>
            <option value="">All types</option>
            {TX_TYPES.map((t) => <option key={t} value={t}>{TX_TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">From</label>
          <input className="input" type="date" name="from" defaultValue={current.from} />
        </div>
        <div>
          <label className="label">To</label>
          <input className="input" type="date" name="to" defaultValue={current.to} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="select" name="categoryId" defaultValue={current.categoryId}>
            <option value="">All categories</option>
            {expense.length > 0 && <optgroup label="Expense">{expense.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>}
            {income.length > 0 && <optgroup label="Income">{income.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>}
          </select>
        </div>
        <div>
          <label className="label">Bucket</label>
          <select className="select" name="bucket" defaultValue={current.bucket}>
            <option value="">All buckets</option>
            {BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary flex-1">Apply</button>
          {hasFilter && <a href="/transactions" className="btn">Clear</a>}
        </div>
      </div>
    </form>
  );
}
