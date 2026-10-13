"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, TableProperties, ClipboardPaste } from "lucide-react";
import Drawer from "@/components/Drawer";
import { bulkCreateTransactions, type BulkTxInput } from "@/actions/transactions";
import { BUCKETS, TX_TYPES, TX_TYPE_LABEL, type TxType, type Bucket } from "@/lib/constants";
import { formatINR } from "@/lib/format";

type Cat = { id: number; name: string; defaultBucket: string; kind: string };

type Row = {
  id: string;
  date: string;
  type: TxType;
  categoryId: string;
  bucket: Bucket;
  description: string;
  amount: string;
  notes: string;
};

function makeEmptyRow(date?: string): Row {
  return {
    id: Math.random().toString(36).slice(2, 9),
    date: date || new Date().toISOString().slice(0, 10),
    type: "expense",
    categoryId: "",
    bucket: "Needs",
    description: "",
    amount: "",
    notes: "",
  };
}

export default function BulkTransactionForm({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([
    makeEmptyRow(),
    makeEmptyRow(),
    makeEmptyRow(),
    makeEmptyRow(),
    makeEmptyRow(),
  ]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);

  function addRow(count = 1) {
    const newRows = Array.from({ length: count }, () => makeEmptyRow(today));
    setRows((prev) => [...prev, ...newRows]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function updateRow<K extends keyof Row>(id: string, key: K, value: Row[K]) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [key]: value };

        // When category changes, auto-set bucket if it's an expense
        if (key === "categoryId" && updated.type === "expense") {
          const cat = categories.find((c) => String(c.id) === String(value));
          if (cat && BUCKETS.includes(cat.defaultBucket as Bucket)) {
            updated.bucket = cat.defaultBucket as Bucket;
          }
        }

        // When type changes to lending/repayment, clear category
        if (key === "type" && (value === "lending" || value === "repayment")) {
          updated.categoryId = "";
        }

        return updated;
      })
    );
  }

  function clearEmptyRows() {
    const kept = rows.filter((r) => r.amount && Number(r.amount) > 0);
    setRows(kept.length ? kept : [makeEmptyRow(today)]);
  }

  function handlePasteParse() {
    if (!pasteText.trim()) return;

    const lines = pasteText.trim().split("\n");
    const parsedRows: Row[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Handle tab-separated (from Excel/Sheets) or comma-separated
      const cols = line.includes("\t")
        ? line.split("\t").map((c) => c.trim())
        : line.split(",").map((c) => c.trim());

      // Try matching common columns: [Date, Type, Category, Bucket, Description, Amount, Notes]
      let date = today;
      let type: TxType = "expense";
      let categoryId = "";
      let bucket: Bucket = "Needs";
      let description = "";
      let amount = "";
      let notes = "";

      if (cols.length >= 6) {
        // Full table format: Date, Type, Category, Bucket, Description, Amount, Notes
        const parsedDate = new Date(cols[0]);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().slice(0, 10);
        }

        const tLower = cols[1].toLowerCase();
        if (tLower.includes("income")) type = "income";
        else if (tLower.includes("lending")) type = "lending";
        else if (tLower.includes("repay")) type = "repayment";
        else type = "expense";

        const matchedCat = categories.find((c) => c.name.toLowerCase() === cols[2].toLowerCase());
        if (matchedCat) {
          categoryId = String(matchedCat.id);
          if (BUCKETS.includes(matchedCat.defaultBucket as Bucket)) {
            bucket = matchedCat.defaultBucket as Bucket;
          }
        }

        if (BUCKETS.includes(cols[3] as Bucket)) bucket = cols[3] as Bucket;

        description = cols[4] === "—" ? "" : cols[4];
        amount = cols[5].replace(/[^0-9.]/g, "");
        notes = cols[6] || "";
      } else if (cols.length === 2 || cols.length === 3) {
        // Quick format: [Amount, Description, Category]
        amount = cols[0].replace(/[^0-9.]/g, "");
        description = cols[1] || "";
        if (cols[2]) {
          const matchedCat = categories.find((c) => c.name.toLowerCase().includes(cols[2].toLowerCase()));
          if (matchedCat) categoryId = String(matchedCat.id);
        }
      }

      if (amount && Number(amount) > 0) {
        parsedRows.push({
          id: Math.random().toString(36).slice(2, 9),
          date,
          type,
          categoryId,
          bucket,
          description,
          amount,
          notes,
        });
      }
    }

    if (parsedRows.length) {
      setRows((prev) => [...prev.filter((r) => r.amount && Number(r.amount) > 0), ...parsedRows]);
      setPasteText("");
      setPasteOpen(false);
    }
  }

  const validEntries = rows.filter((r) => r.amount && Number(r.amount) > 0);
  const totalAmount = validEntries.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  function onSubmit() {
    setError(null);
    if (!validEntries.length) {
      setError("Please fill in at least one entry with an amount.");
      return;
    }

    const payload: BulkTxInput[] = validEntries.map((r) => ({
      type: r.type,
      date: r.date,
      amount: Number(r.amount),
      categoryId: r.categoryId ? Number(r.categoryId) : null,
      bucket: r.type === "expense" ? r.bucket : null,
      description: r.description.trim() || null,
      notes: r.notes.trim() || null,
    }));

    startTransition(async () => {
      const res = await bulkCreateTransactions(payload);
      if (res.ok) {
        setOpen(false);
        setRows([makeEmptyRow(), makeEmptyRow(), makeEmptyRow(), makeEmptyRow(), makeEmptyRow()]);
      } else {
        setError(res.error || "Failed to save entries.");
      }
    });
  }

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        <TableProperties size={16} /> Bulk Add
      </button>

      {open && (
        <Drawer open={open} onClose={() => setOpen(false)} title="Bulk Add Entries" subtitle="Batch entry table and clipboard spreadsheet importer" maxWidth="max-w-5xl">
        <div className="space-y-4 flex flex-col min-h-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-ghost text-xs" onClick={() => addRow(1)}>
                <Plus size={14} /> Add Row
              </button>
              <button type="button" className="btn btn-ghost text-xs" onClick={() => addRow(5)}>
                +5 Rows
              </button>
              <button type="button" className="btn btn-ghost text-xs" onClick={clearEmptyRows}>
                Clear empty
              </button>
            </div>

            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() => setPasteOpen((v) => !v)}
            >
              <ClipboardPaste size={14} /> {pasteOpen ? "Hide Paste Tool" : "Paste from Excel / CSV"}
            </button>
          </div>

          {pasteOpen && (
            <div className="card p-3 space-y-2 panel-2">
              <div className="text-xs muted">
                Paste rows copied directly from <b>Excel, Google Sheets</b>, or comma-separated text.
              </div>
              <textarea
                className="input text-xs font-mono"
                rows={4}
                placeholder={`04 Oct 2026\tExpense\tGroceries\tNeeds\tBhavani Supermarket\t720\tgroceries\n04 Oct 2026\tExpense\tMilk\tNeeds\t—\t90`}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-ghost text-xs" onClick={() => setPasteOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary text-xs" onClick={handlePasteParse}>
                  Parse & Insert into Table
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto border rounded-xl" style={{ maxHeight: "55vh" }}>
            <table className="table min-w-[850px] text-xs">
              <thead className="sticky top-0 bg-[var(--panel)] z-10">
                <tr>
                  <th className="w-8">#</th>
                  <th className="w-32">Date</th>
                  <th className="w-28">Type</th>
                  <th className="w-40">Category</th>
                  <th className="w-28">Bucket</th>
                  <th className="w-36">Merchant / Person</th>
                  <th className="w-28 text-right">Amount (₹)</th>
                  <th>Notes</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const isExpense = r.type === "expense";
                  const isIncome = r.type === "income";
                  const cats = categories.filter((c) => (isIncome ? c.kind === "income" : c.kind === "expense"));

                  return (
                    <tr key={r.id}>
                      <td className="muted text-center">{i + 1}</td>
                      <td>
                        <input
                          type="date"
                          className="input py-1 px-2 text-xs"
                          value={r.date}
                          onChange={(e) => updateRow(r.id, "date", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="select py-1 px-2 text-xs"
                          value={r.type}
                          onChange={(e) => updateRow(r.id, "type", e.target.value as TxType)}
                        >
                          {TX_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {TX_TYPE_LABEL[t]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {isExpense || isIncome ? (
                          <select
                            className="select py-1 px-2 text-xs"
                            value={r.categoryId}
                            onChange={(e) => updateRow(r.id, "categoryId", e.target.value)}
                          >
                            <option value="">— None —</option>
                            {cats.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="muted px-2">—</span>
                        )}
                      </td>
                      <td>
                        {isExpense ? (
                          <select
                            className="select py-1 px-2 text-xs"
                            value={r.bucket}
                            onChange={(e) => updateRow(r.id, "bucket", e.target.value as Bucket)}
                          >
                            {BUCKETS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="muted px-2">—</span>
                        )}
                      </td>
                      <td>
                        <input
                          className="input py-1 px-2 text-xs"
                          placeholder={r.type === "lending" || r.type === "repayment" ? "Person name" : "Merchant / Store"}
                          value={r.description}
                          onChange={(e) => updateRow(r.id, "description", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="input py-1 px-2 text-xs text-right font-semibold"
                          placeholder="0"
                          value={r.amount}
                          onChange={(e) => updateRow(r.id, "amount", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="input py-1 px-2 text-xs"
                          placeholder="optional"
                          value={r.notes}
                          onChange={(e) => updateRow(r.id, "notes", e.target.value)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost py-1 px-1.5 text-danger"
                          onClick={() => removeRow(r.id)}
                          title="Remove row"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

          {/* Sticky Drawer Footer */}
          <div className="sticky bottom-0 z-20 bg-[var(--panel)] -mx-5 -mb-4 px-5 py-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 mt-auto">
            <div className="text-xs muted">
              <b>{validEntries.length}</b> {validEntries.length === 1 ? "entry" : "entries"} to save · Total:{" "}
              <b className="text-[var(--text)]">{formatINR(totalAmount)}</b>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={isPending || validEntries.length === 0}
              >
                {isPending ? "Saving all…" : `Save All (${validEntries.length})`}
              </button>
            </div>
          </div>
        </div>
      </Drawer>
      )}
    </>
  );
}

