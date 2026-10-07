import { formatINR, formatPct, pctOf } from "@/lib/format";
import { BUCKET_COLORS, type Bucket } from "@/lib/constants";

type Item = { name: string; bucket: string | null; amount: number };

export default function CategoryExpenses({ items, total }: { items: Item[]; total: number }) {
  if (items.length === 0) {
    return <div className="muted text-sm py-10 text-center">No expenses logged this month yet.</div>;
  }

  return (
    <div className="space-y-3.5">
      {items.map((it) => {
        const color = it.bucket && BUCKET_COLORS[it.bucket as Bucket] ? BUCKET_COLORS[it.bucket as Bucket] : "#64748b";
        const pct = pctOf(it.amount, total);
        return (
          <div key={it.name}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: color }} />
                <span className="truncate">{it.name}</span>
              </span>
              <span className="muted whitespace-nowrap ml-2">
                {formatINR(it.amount)} <span className="text-xs">({formatPct(pct)})</span>
              </span>
            </div>
            <div className="progress"><span style={{ width: `${Math.min(pct, 100)}%`, background: color }} /></div>
          </div>
        );
      })}
    </div>
  );
}
