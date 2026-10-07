"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/Modal";
import { createTransaction, updateTransaction, type FormState } from "@/actions/transactions";
import { BUCKETS, TX_TYPES, TX_TYPE_LABEL, TX_TYPE_COLOR, type TxType } from "@/lib/constants";

type Cat = { id: number; name: string; defaultBucket: string; kind: string };
export type TxInitial = {
  id: number; type: string; date: string; amount: number;
  categoryId: number | null; bucket: string | null;
  description: string | null; notes: string | null;
};

export default function TransactionForm({ categories, initial }: { categories: Cat[]; initial?: TxInitial }) {
  const isEdit = !!initial;
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    isEdit ? updateTransaction : createTransaction, {}
  );
  const [type, setType] = useState<TxType>((initial?.type as TxType) ?? "expense");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ? String(initial.categoryId) : "");
  const [bucket, setBucket] = useState(initial?.bucket ?? "Needs");
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state?.ok) return;
    if (state.andNext) {
      formRef.current?.reset();
      setCategoryId("");
      requestAnimationFrame(() => amountRef.current?.focus());
    } else {
      setOpen(false);
    }
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);
  const usesCategory = type === "expense" || type === "income";
  const isLoan = type === "lending" || type === "repayment";
  const cats = categories.filter((c) => (type === "income" ? c.kind === "income" : c.kind === "expense"));

  function onTypeChange(t: TxType) {
    setType(t);
    if (t !== "expense" && t !== "income") setCategoryId("");
  }

  function onCategoryChange(id: string) {
    setCategoryId(id);
    const c = categories.find((x) => String(x.id) === id);
    if (c && type === "expense" && BUCKETS.includes(c.defaultBucket as (typeof BUCKETS)[number])) setBucket(c.defaultBucket);
  }

  return (
    <>
      {isEdit ? (
        <button className="btn btn-ghost" onClick={() => setOpen(true)} title="Edit" aria-label="Edit"><Pencil size={15} /></button>
      ) : (
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Entry</button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Edit Entry" : "Add Entry"}>
        <form ref={formRef} action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={initial!.id} />}
          <input type="hidden" name="type" value={type} />

          <div className="grid grid-cols-2 gap-2">
            {TX_TYPES.map((t) => (
              <button type="button" key={t} onClick={() => onTypeChange(t)}
                className="btn"
                style={type === t ? { borderColor: TX_TYPE_COLOR[t], color: TX_TYPE_COLOR[t], background: `color-mix(in srgb, ${TX_TYPE_COLOR[t]} 14%, transparent)` } : undefined}>
                {TX_TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          {isLoan && (
            <p className="muted text-xs -mt-1">
              {type === "lending"
                ? "Money you gave out, expected back. Not counted as an expense."
                : "Money returned to you from a past loan. Not counted as income."}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" name="date" defaultValue={initial?.date ?? today} required />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input ref={amountRef} className="input" type="number" name="amount" step="0.01" min="0" defaultValue={initial?.amount} placeholder="0" required />
            </div>
          </div>

          {usesCategory && (
            <div>
              <label className="label">Category</label>
              <select className="select" name="categoryId" value={categoryId} onChange={(e) => onCategoryChange(e.target.value)}>
                <option value="">— None —</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {type === "expense" && (
            <div>
              <label className="label">Budget Bucket</label>
              <select className="select" name="bucket" value={bucket} onChange={(e) => setBucket(e.target.value)}>
                {BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">{isLoan ? "Person / Party" : "Description / Merchant"}</label>
            <input className="input" name="description" defaultValue={initial?.description ?? ""} placeholder={isLoan ? "e.g. Rohan (friend)" : "e.g. Bank of Baroda"} />
          </div>
          <div>
            <label className="label">Notes / Reference</label>
            <input className="input" name="notes" defaultValue={initial?.notes ?? ""} placeholder="optional" />
          </div>

          {state?.error && <p className="text-sm" style={{ color: "var(--danger)" }}>{state.error}</p>}
          {state?.ok && state?.andNext && <p className="text-sm" style={{ color: "var(--accent-2)" }}>Saved — add another.</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            {!isEdit && (
              <button type="submit" name="andNext" value="1" className="btn" disabled={pending}>
                {pending ? "Saving…" : "Save & Next"}
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
