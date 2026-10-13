"use client";

import { useState } from "react";
import { HelpCircle, Calculator, PieChart, Repeat, ArrowRightLeft } from "lucide-react";
import Drawer from "@/components/Drawer";

export default function HelpDrawer({
  variant = "button",
}: {
  variant?: "button" | "icon" | "nav";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "nav" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-ghost w-full justify-start text-xs text-[var(--muted)] hover:text-[var(--text)] gap-2.5"
          title="Dashboard & Calculation Guide"
        >
          <HelpCircle size={15} />
          <span>Documentation & Guide</span>
        </button>
      ) : variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-8 w-8 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition font-mono text-xs font-bold border border-[var(--border)]"
          title="How the dashboard is calculated"
          aria-label="Help and documentation"
        >
          ?
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-ghost text-xs text-[var(--muted)] hover:text-[var(--text)] gap-1.5"
          title="How the dashboard is calculated"
        >
          <HelpCircle size={14} />
          <span>Help</span>
        </button>
      )}

      {open && (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title="Calculation Methodology & Guide"
          subtitle="Formulas, 50/30/20 framework, and ledger accounting"
          footer={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          }
        >
          <div className="space-y-6 text-xs leading-relaxed text-[var(--text)]">
            {/* Section 1: 50/30/20 Framework */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                <PieChart size={14} className="text-[var(--accent)]" />
                <span>The 50 / 30 / 20 Budget Rule</span>
              </div>
              <div className="card p-3.5 space-y-2.5 panel-2 border-[var(--border)]">
                <p className="text-[var(--muted)]">
                  The classic personal finance framework divides your post-tax monthly income into three distinct buckets:
                </p>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-md bg-[var(--panel)] border border-[var(--border)]">
                    <span className="font-semibold text-[var(--text)]">Needs (50%)</span>
                    <p className="text-[var(--muted)] text-[11px] mt-0.5">
                      Essential survival and living obligations: Rent/EMI, groceries, utilities, basic insurance, and essential transit.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-md bg-[var(--panel)] border border-[var(--border)]">
                    <span className="font-semibold text-[var(--text)]">Wants (30%)</span>
                    <p className="text-[var(--muted)] text-[11px] mt-0.5">
                      Discretionary lifestyle choices: Dining out, entertainment, subscriptions, hobbies, travel, and personal shopping.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-md bg-[var(--panel)] border border-[var(--border)]">
                    <span className="font-semibold text-[var(--accent)]">Savings & SIPs (20%)</span>
                    <p className="text-[var(--muted)] text-[11px] mt-0.5">
                      Wealth accumulation and future security: Equity mutual fund SIPs, emergency fund reserves, PPF, and debt reduction.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Formulas & Metrics */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                <Calculator size={14} className="text-[var(--accent)]" />
                <span>Dashboard Calculations & Formulas</span>
              </div>
              <div className="card p-3.5 space-y-2.5 panel-2 border-[var(--border)]">
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between items-start gap-3 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text)] whitespace-nowrap">Monthly Income</span>
                    <span className="text-[var(--muted)] text-right">Sum of all positive income entries recorded for the current calendar month.</span>
                  </div>
                  <div className="flex justify-between items-start gap-3 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text)] whitespace-nowrap">Target Budget</span>
                    <span className="text-[var(--muted)] text-right"><code>Income × Rule %</code> (e.g. Needs = Income × 50%). Configurable in Settings.</span>
                  </div>
                  <div className="flex justify-between items-start gap-3 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text)] whitespace-nowrap">Exp Commitments</span>
                    <span className="text-[var(--muted)] text-right">Sum of active recurring items & SIPs configured in your recurring planner.</span>
                  </div>
                  <div className="flex justify-between items-start gap-3 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text)] whitespace-nowrap">Actual Outflow</span>
                    <span className="text-[var(--muted)] text-right">Sum of all expense entries logged across Needs, Wants, and Savings for the month.</span>
                  </div>
                  <div className="flex justify-between items-start gap-3">
                    <span className="font-semibold text-[var(--accent)] whitespace-nowrap">Unspent Cash</span>
                    <span className="text-[var(--muted)] text-right"><code>Monthly Income − Actual Outflow</code>. Surplus liquid cash remaining.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Lending & Repayments Ledger */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                <ArrowRightLeft size={14} className="text-[var(--accent)]" />
                <span>Lending & Debt Tracking</span>
              </div>
              <div className="card p-3.5 space-y-2 panel-2 border-[var(--border)] text-[11px] text-[var(--muted)]">
                <p>
                  To keep cash flow accurate without distorting your personal living expense statistics:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[var(--text)]">
                  <li><b>Lending</b>: Money you lend to a third party. Tracked as an account receivable; <i>not counted as an expense</i>.</li>
                  <li><b>Repayment</b>: Money returned to you from a prior loan. Tracked as receivable recovery; <i>not counted as income</i>.</li>
                  <li><b>Outstanding Lent</b>: Total Lent − Total Repaid. Shows how much capital remains owed to you.</li>
                </ul>
              </div>
            </div>

            {/* Section 4: Recurring Settlement */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                <Repeat size={14} className="text-[var(--accent)]" />
                <span>Monthly Recurring Auto-Settlement</span>
              </div>
              <div className="card p-3.5 panel-2 border-[var(--border)] text-[11px] text-[var(--muted)] leading-relaxed">
                Toggling <b>Paid</b> on a recurring commitment marks it as settled for the current calendar month (<code>YYYY-MM</code>). When the month rolls over to the 1st of the next month, statuses automatically reset to <b>Unpaid</b> without requiring manual maintenance or background cron jobs.
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
}

