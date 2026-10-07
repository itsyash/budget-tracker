"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/actions/auth";
import { Wallet, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAction, {});

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-weak)", color: "var(--accent-2)" }}>
            <Wallet size={22} />
          </span>
          <div>
            <div className="font-bold text-lg leading-tight">Budget Tracker</div>
            <div className="muted text-xs">Create your account</div>
          </div>
        </div>

        <form action={action} className="card p-6 space-y-4">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" name="name" className="input" placeholder="Your name" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" className="input" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} className="input" placeholder="At least 6 characters" required />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={6} className="input" placeholder="Repeat password" required />
          </div>

          {state?.error && <p className="text-sm" style={{ color: "var(--danger)" }}>{state.error}</p>}

          <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            <UserPlus size={16} />
            {pending ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="muted text-sm text-center mt-4">
          Already have an account? <Link href="/login" className="accent">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
