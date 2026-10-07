"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { updateAiSettings, type FormState } from "@/actions/settings";

export default function AiKeyForm({ hasKey, maskedKey, model }: { hasKey: boolean; maskedKey: string | null; model: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateAiSettings, {});

  return (
    <form action={action} className="card p-6 space-y-4 max-w-xl">
      <div>
        <h3 className="font-bold mb-1">AI Key (Groq)</h3>
        <p className="muted text-sm">
          Powers the Telegram bot&apos;s message parsing. Get a free key at{" "}
          <a className="accent" href="https://console.groq.com" target="_blank" rel="noreferrer">console.groq.com</a>.
        </p>
      </div>

      {hasKey && (
        <p className="muted text-sm">Current key: <code>{maskedKey}</code> · leave the field blank to keep it.</p>
      )}

      <div>
        <label className="label">Groq API Key</label>
        <input className="input" type="password" name="groqApiKey" autoComplete="off" placeholder={hasKey ? "•••• (unchanged)" : "gsk_..."} />
      </div>
      <div>
        <label className="label">Model (optional)</label>
        <input className="input" name="groqModel" defaultValue={model} placeholder="openai/gpt-oss-20b" />
      </div>

      {state?.error && <p className="text-sm" style={{ color: "var(--danger)" }}>{state.error}</p>}
      {state?.ok && <p className="text-sm" style={{ color: "var(--accent-2)" }}>AI key saved.</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        <KeyRound size={16} /> {pending ? "Saving…" : "Save AI key"}
      </button>
    </form>
  );
}
