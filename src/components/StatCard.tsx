import type { ReactNode } from "react";

export default function StatCard({
  label, value, hint, icon, valueColor,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="card p-3.5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="muted text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        {icon && <span className="muted opacity-70">{icon}</span>}
      </div>
      <div className="text-xl font-bold mt-2 tracking-tight text-[var(--text)]" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {hint && <div className="muted text-[11px] mt-1 truncate">{hint}</div>}
    </div>
  );
}
