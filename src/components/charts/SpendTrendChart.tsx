"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR, formatINRCompact } from "@/lib/format";

type Series = { label: string; amount: number }[];
type Range = "7d" | "30d" | "12m";

export default function SpendTrendChart({ d7, d30, m12 }: { d7: Series; d30: Series; m12: Series }) {
  const [range, setRange] = useState<Range>("30d");
  const data = range === "7d" ? d7 : range === "30d" ? d30 : m12;
  const total = data.reduce((s, x) => s + x.amount, 0);

  const LABELS: Record<Range, string> = { "7d": "7D", "30d": "30D", "12m": "12M" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold">Spend Trend</h3>
          <p className="muted text-xs mt-0.5">Expense outflow over time</p>
        </div>
        <div className="flex rounded-lg p-0.5" style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }}>
          {(["7d", "30d", "12m"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className="px-3 py-1 text-xs font-semibold rounded-md"
              style={range === r ? { background: "var(--accent)", color: "#04150f" } : { color: "var(--muted)" }}>
              {LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div className="h-[260px] flex items-center justify-center muted text-sm">No expense activity in this period.</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} minTickGap={16} />
            <YAxis tickFormatter={(v) => formatINRCompact(Number(v))} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={56} />
            <Tooltip formatter={(v) => formatINR(Number(v))}
              contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13 }} />
            <Area type="monotone" dataKey="amount" name="Spent" stroke="#10b981" strokeWidth={2} fill="url(#spendFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
