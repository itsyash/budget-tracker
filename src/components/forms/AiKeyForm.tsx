"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { updateAiSettings, type FormState } from "@/actions/settings";

export default function AiKeyForm({ hasKey, maskedKey, model }: { hasKey: boolean; maskedKey: string | null; model: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateAiSettings, {});

  return (
    <form action={action} className="card p-4 space-y-3.5 max-w-xl">
      <div>
        <h3 className="font-bold text-sm tracking-tight text-[var(--text)] mb-0.5">AI Key (Groq)</h3>
        <p className="muted text-xs">
          Powers the Telegram bot&apos;s message parsing. Get a free key at{" "}
          <a className="accent hover:underline font-medium" href="https://console.groq.com" target="_blank" rel="noreferrer">console.groq.com</a>.
        </p>
      </div>

      {hasKey && (
        <p className="muted text-xs">Current key: <code>{maskedKey}</code> · leave the field blank to keep it.</p>
      )}

      <div>
        <label className="label">Groq API Key</label>
        <input className="input" type="password" name="groqApiKey" autoComplete="off" placeholder={hasKey ? "•••• (unchanged)" : "gsk_..."} />
      </div>
      <div>
        <label className="label">Model (optional)</label>
        <input className="input" name="groqModel" defaultValue={model} placeholder="openai/gpt-oss-20b" />
      </div>

      {state?.error && <p className="text-xs" style={{ color: "var(--danger)" }}>{state.error}</p>}
      {state?.ok && <p className="text-xs" style={{ color: "var(--accent)" }}>AI key saved.</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        <KeyRound size={15} /> {pending ? "Saving…" : "Save AI key"}
      </button>
    </form>
  );
}
