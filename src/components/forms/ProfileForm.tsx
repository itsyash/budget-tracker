"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateProfile, type FormState } from "@/actions/settings";

export default function ProfileForm({ name, email, memberSince }: { name: string; email: string; memberSince: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});

  return (
    <form action={action} className="card p-4 space-y-3.5">
      <div>
        <h3 className="font-bold text-sm tracking-tight text-[var(--text)] mb-0.5">Profile</h3>
        <p className="muted text-xs">Your account details.</p>
      </div>
      <div>
        <label className="label">Name</label>
        <input className="input" name="name" defaultValue={name} placeholder="Your name" />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" value={email} disabled style={{ opacity: 0.65 }} />
        <p className="muted text-[11px] mt-1">Email can&apos;t be changed.</p>
      </div>
      <div className="muted text-[11px]">Member since {memberSince}</div>

      {state?.error && <p className="text-xs" style={{ color: "var(--danger)" }}>{state.error}</p>}
      {state?.ok && <p className="text-xs" style={{ color: "var(--accent)" }}>Profile saved.</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        <Save size={15} /> {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
