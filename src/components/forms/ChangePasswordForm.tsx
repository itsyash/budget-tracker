"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound } from "lucide-react";
import { changePasswordAction, type PasswordState } from "@/actions/auth";

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { if (state?.ok) formRef.current?.reset(); }, [state]);

  return (
    <form ref={formRef} action={action} className="card p-6 space-y-4 max-w-xl">
      <div>
        <h3 className="font-bold mb-1">Change Password</h3>
        <p className="muted text-sm">Update your login password.</p>
      </div>

      <div>
        <label className="label">Current password</label>
        <input className="input" type="password" name="current" autoComplete="current-password" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">New password</label>
          <input className="input" type="password" name="next" autoComplete="new-password" minLength={6} required />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input className="input" type="password" name="confirm" autoComplete="new-password" minLength={6} required />
        </div>
      </div>

      {state?.error && <p className="text-sm" style={{ color: "var(--danger)" }}>{state.error}</p>}
      {state?.ok && <p className="text-sm" style={{ color: "var(--accent-2)" }}>Password updated.</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        <KeyRound size={16} /> {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
