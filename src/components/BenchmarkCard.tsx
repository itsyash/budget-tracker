import { formatINR, formatPct, pctOf } from "@/lib/format";
import { BUCKET_COLORS, type Bucket } from "@/lib/constants";

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
  const color = BUCKET_COLORS[bucket];
  const actualPct = pctOf(actual, income);
  const expectedPct = pctOf(expected, income);
  const over = bucket === "Savings" ? actual >= target : actual > target;
  const status = statusFor(bucket, over);
  const fill = target > 0 ? Math.min((actual / target) * 100, 100) : 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />
          <h3 className="font-bold">{bucket} <span className="muted font-medium">({pct}% Rule)</span></h3>
        </div>
        <span className="badge" style={status.danger ? { color: "var(--danger)", borderColor: "color-mix(in srgb, var(--danger) 45%, transparent)" } : { color, borderColor: "color-mix(in srgb, " + color + " 45%, transparent)" }}>
          {status.text}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        {[
          { k: "Target (Rule)", amt: target, p: pct },
          { k: "Expected", amt: expected, p: expectedPct },
          { k: "Actual Outflow", amt: actual, p: actualPct, accent: true },
        ].map((c) => (
          <div key={c.k}>
            <div className="muted text-[11px] font-semibold uppercase tracking-wide mb-1">{c.k}</div>
            <div className="font-bold text-sm" style={c.accent ? { color } : undefined}>{formatINR(c.amt)}</div>
            <div className="muted text-[11px]">{formatPct(c.p)}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] muted mb-1.5">
        <span>Actual: {formatPct(actualPct)} of income</span>
        <span>Cap: {pct}%</span>
      </div>
      <div className="progress">
        <span style={{ width: `${fill}%`, background: status.danger ? "var(--danger)" : color }} />
      </div>

      <p className="muted text-xs mt-3 leading-relaxed">{messageFor(bucket, pct, target, actual, actualPct)}</p>

      {breakdown && (
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="muted text-[11px] font-semibold uppercase tracking-wide mb-2">By category</div>
          {breakdown.length === 0 ? (
            <div className="muted text-xs">No spending in this bucket yet.</div>
          ) : (
            <div className="space-y-2">
              {breakdown.map((it) => {
                const p = pctOf(it.amount, actual);
                return (
                  <div key={it.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="truncate">{it.name}</span>
                      <span className="muted whitespace-nowrap ml-2">{formatINR(it.amount)} <span className="opacity-70">({formatPct(p)})</span></span>
                    </div>
                    <div className="progress" style={{ height: 6 }}><span style={{ width: `${Math.min(p, 100)}%`, background: color }} /></div>
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
