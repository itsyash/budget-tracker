"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/Modal";
import { createRecurring, updateRecurring, type FormState } from "@/actions/recurring";
import { BUCKETS, NATURES } from "@/lib/constants";

type Cat = { id: number; name: string; kind: string };
export type RecInitial = {
  id: number; name: string; categoryId: number | null; bucket: string;
  monthlyExpected: number; nature: string; notes: string | null; active: boolean;
};

export default function RecurringForm({ categories, initial }: { categories: Cat[]; initial?: RecInitial }) {
  const isEdit = !!initial;
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    isEdit ? updateRecurring : createRecurring, {}
  );
  useEffect(() => { if (state?.ok) setOpen(false); }, [state]);

  const cats = categories.filter((c) => c.kind === "expense");

  return (
    <>
      {isEdit ? (
        <button className="btn btn-ghost" onClick={() => setOpen(true)} title="Edit" aria-label="Edit"><Pencil size={15} /></button>
      ) : (
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Item</button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Edit Recurring Item" : "Add Recurring Item"}>
        <form action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={initial!.id} />}

          <div>
            <label className="label">Item Name</label>
            <input className="input" name="name" defaultValue={initial?.name ?? ""} placeholder="e.g. Home Loan EMI" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Monthly Expected (₹)</label>
              <input className="input" type="number" name="monthlyExpected" step="0.01" min="0" defaultValue={initial?.monthlyExpected} required />
            </div>
            <div>
              <label className="label">Bucket</label>
              <select className="select" name="bucket" defaultValue={initial?.bucket ?? "Needs"}>
                {BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nature</label>
              <select className="select" name="nature" defaultValue={initial?.nature ?? "Fixed"}>
                {NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="select" name="categoryId" defaultValue={initial?.categoryId ? String(initial.categoryId) : ""}>
                <option value="">— None —</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes / Details</label>
            <input className="input" name="notes" defaultValue={initial?.notes ?? ""} placeholder="optional" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={initial ? initial.active : true} />
            Active (include in Expected totals)
          </label>

          {state?.error && <p className="text-sm" style={{ color: "var(--danger)" }}>{state.error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
