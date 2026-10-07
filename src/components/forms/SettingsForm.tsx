"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { updateSettings, type FormState } from "@/actions/settings";

type Props = { needsPct: number; wantsPct: number; savingsPct: number; currency: string };

export default function SettingsForm(initial: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateSettings, {});
  const [needs, setNeeds] = useState(initial.needsPct);
  const [wants, setWants] = useState(initial.wantsPct);
  const [savings, setSavings] = useState(initial.savingsPct);

  const sum = Math.round((Number(needs) || 0) + (Number(wants) || 0) + (Number(savings) || 0));
  const valid = sum === 100;

  return (
    <form action={action} className="card p-6 space-y-5 max-w-xl">
      <div>
        <h3 className="font-bold mb-1">Budget Rule</h3>
        <p className="muted text-sm">Your allocation targets. The three must add up to 100%. Default is the 50 / 30 / 20 rule.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { name: "needsPct", label: "Needs %", val: needs, set: setNeeds },
          { name: "wantsPct", label: "Wants %", val: wants, set: setWants },
          { name: "savingsPct", label: "Savings %", val: savings, set: setSavings },
        ].map((f) => (
          <div key={f.name}>
            <label className="label">{f.label}</label>
            <input className="input" type="number" name={f.name} min="0" max="100" step="1"
              value={f.val} onChange={(e) => f.set(Number(e.target.value))} required />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="muted">Total allocation</span>
        <span className="font-bold" style={{ color: valid ? "var(--accent-2)" : "var(--danger)" }}>{sum}%</span>
      </div>

      <div>
        <label className="label">Currency Code</label>
        <input className="input max-w-[140px]" name="currency" defaultValue={initial.currency} />
      </div>

      {state?.error && <p className="text-sm" style={{ color: "var(--danger)" }}>{state.error}</p>}
      {state?.ok && <p className="text-sm" style={{ color: "var(--accent-2)" }}>Settings saved.</p>}

      <button type="submit" className="btn btn-primary" disabled={pending || !valid}>
        <Save size={16} /> {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
