"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import Modal from "@/components/Modal";
import { createCategory, updateCategory, type FormState } from "@/actions/categories";
import { BUCKETS } from "@/lib/constants";

export type CatInitial = { id: number; name: string; defaultBucket: string; kind: string };

export default function CategoryForm({ initial }: { initial?: CatInitial }) {
  const isEdit = !!initial;
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    isEdit ? updateCategory : createCategory, {}
  );
  const [kind, setKind] = useState(initial?.kind ?? "expense");
  useEffect(() => { if (state?.ok) setOpen(false); }, [state]);

  const bucketOptions = kind === "income" ? ["Income"] : BUCKETS;

  return (
    <>
      {isEdit ? (
        <button className="btn btn-ghost" onClick={() => setOpen(true)} title="Edit" aria-label="Edit"><Pencil size={15} /></button>
      ) : (
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Category</button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Edit Category" : "Add Category"}>
        <form action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={initial!.id} />}
          <div>
            <label className="label">Name</label>
            <input className="input" name="name" defaultValue={initial?.name ?? ""} placeholder="e.g. Groceries" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kind</label>
              <select className="select" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="label">Default Bucket</label>
              <select className="select" name="defaultBucket" defaultValue={initial?.defaultBucket ?? "Needs"} key={kind}>
                {bucketOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
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
