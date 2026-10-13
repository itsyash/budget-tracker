import { formatINR, formatPct, pctOf } from "@/lib/format";
import { type Bucket } from "@/lib/constants";

function statusFor(bucket: Bucket, over: boolean) {
  if (bucket === "Savings") return over ? { text: "On Track", danger: false } : { text: "SIPs Active", danger: false };
  if (bucket === "Wants") return over ? { text: "Over Budget", danger: true } : { text: "Healthy Buffer", danger: false };
  return over ? { text: "Over Target", danger: true } : { text: "Within Target", danger: false };
}

function messageFor(bucket: Bucket, pct: number, target: number, actual: number, actualPct: number) {
  const diff = Math.abs(target - actual);
  const over = actual > target;
  if (bucket === "Savings") {
    return over
      ? `On track — investing ${formatPct(actualPct)} of income vs the ${pct}% target.`
      : `${formatINR(diff)} short of the ${pct}% savings target. Room to boost your SIPs.`;
  }
  if (bucket === "Wants") {
    return over
      ? `Over the ${pct}% wants budget by ${formatINR(diff)}.`
      : `Healthy buffer. ${formatPct(actualPct)} spent out of ${pct}% allowance, ${formatINR(diff)} discretionary left.`;
  }
  return over
    ? `Over the ${pct}% needs limit by ${formatINR(diff)}. Spending is at ${formatPct(actualPct)}.`
    : `Target met. Actual spending is ${formatPct(actualPct)}, leaving ${formatINR(diff)} room within the ${pct}% limit.`;
}

export default function BenchmarkCard({
  bucket, pct, target, expected, actual, income, breakdown,
}: {
  bucket: Bucket;
  pct: number;
  target: number;
  expected: number;
  actual: number;
  income: number;
  breakdown?: { name: string; amount: number }[];
}) {
  const actualPct = pctOf(actual, income);
  const expectedPct = pctOf(expected, income);
  const over = bucket === "Savings" ? actual >= target : actual > target;
  const status = statusFor(bucket, over);
  const fill = target > 0 ? Math.min((actual / target) * 100, 100) : 0;

  return (
    <div className="card p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight text-[var(--text)]">{bucket} <span className="muted font-normal text-xs">({pct}% Rule)</span></h3>
          </div>
          <span className={`badge text-[11px] ${status.danger ? "text-[var(--danger)]" : "text-[var(--accent)] font-semibold"}`}>
            {status.text}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mb-3.5 py-2 rounded-md bg-[var(--panel-2)] border border-[var(--border)]">
          {[
            { k: "Target", amt: target, p: pct },
            { k: "Expected", amt: expected, p: expectedPct },
            { k: "Actual", amt: actual, p: actualPct, accent: true },
          ].map((c) => (
            <div key={c.k} className="px-1">
              <div className="muted text-[10px] font-semibold uppercase tracking-wider mb-0.5">{c.k}</div>
              <div className={`font-bold text-xs truncate ${c.accent ? (status.danger ? "text-[var(--danger)]" : "text-[var(--accent)]") : "text-[var(--text)]"}`}>
                {formatINR(c.amt)}
              </div>
              <div className="muted text-[10px]">{formatPct(c.p)}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] muted mb-1">
          <span>Actual: {formatPct(actualPct)} of income</span>
          <span>Target: {pct}%</span>
        </div>
        <div className="progress">
          <span style={{ width: `${fill}%`, background: status.danger ? "var(--danger)" : "var(--accent)" }} />
        </div>

        <p className="muted text-[11px] mt-2.5 leading-relaxed">{messageFor(bucket, pct, target, actual, actualPct)}</p>
      </div>

      {breakdown && (
        <div className="mt-3.5 pt-3 border-t border-[var(--border)]">
          <div className="muted text-[10px] font-semibold uppercase tracking-wider mb-2">By category</div>
          {breakdown.length === 0 ? (
            <div className="muted text-[11px]">No spending in this bucket yet.</div>
          ) : (
            <div className="space-y-1.5">
              {breakdown.map((it) => {
                const p = pctOf(it.amount, actual);
                return (
                  <div key={it.name}>
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="truncate text-[var(--text)]">{it.name}</span>
                      <span className="muted whitespace-nowrap ml-2">{formatINR(it.amount)} <span className="opacity-70">({formatPct(p)})</span></span>
                    </div>
                    <div className="progress" style={{ height: 4 }}>
                      <span style={{ width: `${Math.min(p, 100)}%`, background: status.danger ? "var(--danger)" : "var(--accent)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
