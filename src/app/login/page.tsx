"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";
import { Wallet, LogIn } from "lucide-react";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-weak)", color: "var(--accent-2)" }}>
            <Wallet size={22} />
          </span>
          <div>
            <div className="font-bold text-lg leading-tight">Budget Tracker</div>
            <div className="muted text-xs">50 / 30 / 20 monitor</div>
          </div>
        </div>

        <form action={action} className="card p-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" className="input" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" className="input" placeholder="••••••••" required />
          </div>

          {state?.error && <p className="text-sm" style={{ color: "var(--danger)" }}>{state.error}</p>}

          <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            <LogIn size={16} />
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="muted text-sm text-center mt-4">
          No account yet? <Link href="/register" className="accent">Create one</Link>
        </p>
      </div>
    </div>
  );
}
