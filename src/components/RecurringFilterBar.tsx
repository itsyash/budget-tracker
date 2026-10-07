import { BUCKETS, NATURES } from "@/lib/constants";

type Cat = { id: number; name: string; kind: string };

export default function RecurringFilterBar({
  categories, current,
}: {
  categories: Cat[];
  current: { categoryId: string; bucket: string; nature: string; status: string };
}) {
  const expense = categories.filter((c) => c.kind === "expense");
  const hasFilter = !!(current.categoryId || current.bucket || current.nature || current.status);

  return (
    <form method="get" action="/recurring" className="card p-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="label">Category</label>
          <select className="select" name="categoryId" defaultValue={current.categoryId}>
            <option value="">All categories</option>
            {expense.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Bucket</label>
          <select className="select" name="bucket" defaultValue={current.bucket}>
            <option value="">All buckets</option>
            {BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Nature</label>
          <select className="select" name="nature" defaultValue={current.nature}>
            <option value="">All natures</option>
            {NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="select" name="status" defaultValue={current.status}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary flex-1">Apply</button>
          {hasFilter && <a href="/recurring" className="btn">Clear</a>}
        </div>
      </div>
    </form>
  );
}
