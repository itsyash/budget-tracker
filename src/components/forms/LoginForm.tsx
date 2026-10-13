"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";
import { LogIn } from "lucide-react";

export default function LoginForm({ allowRegister }: { allowRegister: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <>
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

      {allowRegister && (
        <p className="muted text-sm text-center mt-4">
          No account yet? <Link href="/register" className="accent">Create one</Link>
        </p>
      )}
    </>
  );
}
