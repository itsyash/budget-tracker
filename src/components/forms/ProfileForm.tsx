"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateProfile, type FormState } from "@/actions/settings";

export default function ProfileForm({ name, email, memberSince }: { name: string; email: string; memberSince: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});

  return (
    <form action={action} className="card p-6 space-y-4">
      <div>
        <h3 className="font-bold mb-1">Profile</h3>
        <p className="muted text-sm">Your account details.</p>
      </div>
      <div>
        <label className="label">Name</label>
        <input className="input" name="name" defaultValue={name} placeholder="Your name" />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" value={email} disabled style={{ opacity: 0.65 }} />
        <p className="muted text-xs mt-1">Email can&apos;t be changed.</p>
      </div>
      <div className="muted text-xs">Member since {memberSince}</div>

      {state?.error && <p className="text-sm" style={{ color: "var(--danger)" }}>{state.error}</p>}
      {state?.ok && <p className="text-sm" style={{ color: "var(--accent-2)" }}>Profile saved.</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        <Save size={16} /> {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
