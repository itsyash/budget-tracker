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
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="muted text-xs font-semibold uppercase tracking-wide">{label}</span>
        {icon && <span className="muted">{icon}</span>}
      </div>
      <div className="text-2xl font-bold mt-3" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {hint && <div className="muted text-xs mt-1">{hint}</div>}
    </div>
  );
}
