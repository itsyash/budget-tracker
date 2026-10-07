export const BUCKETS = ["Needs", "Wants", "Savings"] as const;
export type Bucket = (typeof BUCKETS)[number];

export const NATURES = ["Fixed", "Expected", "SIP"] as const;
export type Nature = (typeof NATURES)[number];

export const TX_TYPES = ["expense", "income", "lending", "repayment"] as const;
export type TxType = (typeof TX_TYPES)[number];

export const TX_TYPE_LABEL: Record<TxType, string> = {
  expense: "Expense",
  income: "Income",
  lending: "Lending",
  repayment: "Repayment",
};

// Badge/accent color per entry type.
export const TX_TYPE_COLOR: Record<TxType, string> = {
  expense: "#94a3b8", // slate
  income: "#10b981", // green
  lending: "#f59e0b", // amber
  repayment: "#06b6d4", // cyan
};

// 50/30/20 bucket accent colors (also used by charts).
export const BUCKET_COLORS: Record<Bucket, string> = {
  Needs: "#3b82f6", // blue
  Wants: "#8b5cf6", // purple
  Savings: "#10b981", // green
};

export const RULE_LABEL: Record<Bucket, string> = {
  Needs: "50% Rule",
  Wants: "30% Rule",
  Savings: "20% Rule",
};
