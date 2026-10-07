"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR, formatPct, pctOf } from "@/lib/format";

type BucketData = { bucket: string; target: number; expected: number; actual: number };
type Mode = "target" | "expected" | "actual";

const COLORS: Record<string, string> = {
  Needs: "#3b82f6", Wants: "#8b5cf6", Savings: "#10b981", Unspent: "#f59e0b",
};

export default function AllocationDonut({
  income, buckets, actualOutflow,
}: {
  income: number;
  buckets: BucketData[];
  actualOutflow: number;
}) {
  const [mode, setMode] = useState<Mode>("actual");

  const slices = buckets.map((b) => ({ name: b.bucket, value: Math.max(b[mode], 0) }));
  const allocated = slices.reduce((s, x) => s + x.value, 0);
  const unspent = Math.max(income - allocated, 0);
  if (unspent > 0) slices.push({ name: "Unspent", value: unspent });

  const centerPct = mode === "actual" ? pctOf(actualOutflow, income) : pctOf(allocated, income);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="muted text-sm">Percentage breakdown of {formatINR(income)}</div>
        <div className="flex rounded-lg p-0.5" style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }}>
          {(["target", "expected", "actual"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className="px-2.5 py-1 text-xs font-semibold rounded-md capitalize"
              style={mode === m ? { background: "var(--accent)", color: "#04150f" } : { color: "var(--muted)" }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} stroke="none">
              {slices.map((s) => <Cell key={s.name} fill={COLORS[s.name] ?? "#64748b"} />)}
            </Pie>
            <Tooltip formatter={(v) => formatINR(Number(v))}
              contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="muted text-[11px] uppercase tracking-wide">{mode}</span>
          <span className="text-2xl font-bold">{formatPct(centerPct)}</span>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        {slices.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[s.name] ?? "#64748b" }} />
              {s.name === "Unspent" ? "Unspent Cash" : `${s.name} ${mode}`}
            </span>
            <span className="muted">{formatINR(s.value)} <span className="text-xs">({formatPct(pctOf(s.value, income))})</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
