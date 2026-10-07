/** Format a number as Indian Rupees with no decimals, e.g. ₹1,00,000. */
export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Compact INR for chart axes/labels, e.g. ₹53.1k. */
export function formatINRCompact(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  if (Math.abs(v) >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${Math.round(v)}`;
}

export function formatPct(n: number, digits = 1): string {
  return `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;
}

/** Safe percentage of a part over a whole (0 when whole is 0). */
export function pctOf(part: number, whole: number): number {
  if (!whole) return 0;
  return (part / whole) * 100;
}
