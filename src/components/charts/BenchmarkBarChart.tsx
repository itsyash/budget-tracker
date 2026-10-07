"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR, formatINRCompact } from "@/lib/format";

export type BenchmarkRow = { name: string; Target: number; Expected: number; Actual: number };

const tooltipStyle = {
  background: "var(--panel)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: 13,
};

export default function BenchmarkBarChart({ data }: { data: BenchmarkRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => formatINRCompact(Number(v))} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={56} />
        <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,.08)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Target" name="Target (Rule)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expected" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Actual" name="Actual Spent" fill="#0e9f6e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
