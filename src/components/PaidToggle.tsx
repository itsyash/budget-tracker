"use client";

import { useTransition, useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { togglePaidThisMonth } from "@/actions/recurring";

export default function PaidToggle({
  itemId,
  initialPaid,
  disabled = false,
}: {
  itemId: number;
  initialPaid: boolean;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isPaid, setIsPaid] = useState(initialPaid);

  useEffect(() => {
    setIsPaid(initialPaid);
  }, [initialPaid]);

  const handleToggle = () => {
    if (disabled || isPending) return;
    const next = !isPaid;
    setIsPaid(next);
    startTransition(async () => {
      const res = await togglePaidThisMonth(itemId);
      if (!res.ok) {
        setIsPaid(!next);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || isPending}
      title={
        disabled
          ? "Item is paused"
          : isPaid
          ? "Click to mark as unpaid for this month"
          : "Click to mark as paid for this month"
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer select-none ${
        disabled
          ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent"
          : isPaid
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 shadow-xs"
          : "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
    >
      {isPending ? (
        <Loader2 size={12} className="animate-spin text-current" />
      ) : isPaid ? (
        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
          <Check size={9} strokeWidth={3} />
        </span>
      ) : (
        <span className="w-3.5 h-3.5 rounded-full border border-slate-400 dark:border-slate-500 shrink-0" />
      )}
      <span className="font-semibold">{isPaid ? "Paid" : "Unpaid"}</span>
    </button>
  );
}

