// Turns a free-text money message into structured entries using Groq (OpenAI-compatible API).
// Accepts a per-user apiKey/model; falls back to env. Auto-discovers a model if the chosen one isn't accessible.
export type ParsedEntry = {
  type: "expense" | "income" | "lending" | "repayment";
  amount: number;
  categoryName: string | null;
  bucket: "Needs" | "Wants" | "Savings" | null;
  description: string | null;
  notes: string | null;
};

type Cat = { name: string; defaultBucket: string; kind: string };

const GROQ_BASE = "https://api.groq.com/openai/v1";
const BUCKETS = ["Needs", "Wants", "Savings"];
const TYPES = ["expense", "income", "lending", "repayment"];

let cachedModel: string | null = null;

function buildSystem(categories: Cat[]): string {
  const exp = categories.filter((c) => c.kind === "expense").map((c) => `${c.name}→${c.defaultBucket}`).join(", ");
  const inc = categories.filter((c) => c.kind === "income").map((c) => c.name).join(", ");
  return `Convert the user's money message into budget entries. Output ONLY JSON: {"entries":[{"type","amount","categoryName","bucket","description","notes"}]}.
- type: expense | income | lending (gave, expect back) | repayment (got back). Default expense.
- amount: number (6k=6000, "2 lakh"=200000).
- categoryName: EXACTLY one from the lists below, or null. Never invent.
- bucket: expense -> Needs/Wants/Savings (use the category's bucket). Else null.
- description: ONLY a vendor/shop/brand name, or the person for lending/repayment, if mentioned; else null. No item names here.
- notes: the item(s) or purpose (e.g. Clothes, Vegetables, Monthly SIP, "kitchen trolly"), else null.
- Split multiple amounts into separate entries.
- India slang: kirana/sabzi=groceries, petrol/diesel=fuel, panipuri/chai/hotel/restaurant=eating out, recharge=mobile bill, sip=mutual fund.

Expense categories (name→bucket): ${exp}
Income categories: ${inc}

Examples:
"720 groceries" -> {"entries":[{"type":"expense","amount":720,"categoryName":"Groceries & Vegetables","bucket":"Needs","description":null,"notes":null}]}
"2000 clothes, 40 panipuri" -> {"entries":[{"type":"expense","amount":2000,"categoryName":"Shopping","bucket":"Wants","description":null,"notes":"Clothes"},{"type":"expense","amount":40,"categoryName":"Dining / Eating Out","bucket":"Wants","description":null,"notes":"Panipuri"}]}
"lent 500 to Rohan for lunch" -> {"entries":[{"type":"lending","amount":500,"categoryName":null,"bucket":null,"description":"Rohan","notes":"For lunch"}]}`;
}

async function listModels(apiKey: string): Promise<string[]> {
  try {
    const r = await fetch(`${GROQ_BASE}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) return [];
    const d = await r.json();
    return (d?.data ?? []).map((m: { id?: string }) => m.id).filter(Boolean) as string[];
  } catch { return []; }
}

function pickModel(ids: string[]): string | null {
  const bad = /whisper|tts|guard|orpheus|embed|moderation|safeguard|prompt-guard/i;
  const usable = ids.filter((id) => !bad.test(id));
  const prefer = ["openai/gpt-oss-20b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-120b", "qwen/qwen3-32b", "gemma2-9b-it"];
  for (const p of prefer) if (usable.includes(p)) return p;
  return usable[0] ?? null;
}

function chat(apiKey: string, model: string, messages: unknown, useJson: boolean) {
  return fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0, max_tokens: 4096, ...(useJson ? { response_format: { type: "json_object" } } : {}), messages }),
  });
}

export async function parseWithGroq(
  text: string,
  categories: Cat[],
  opts?: { apiKey?: string | null; model?: string | null }
): Promise<ParsedEntry[]> {
  const apiKey = (opts?.apiKey || process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) throw new Error("No Groq API key set. Add yours in the app: Settings → AI Key.");

  const messages = [
    { role: "system", content: buildSystem(categories) },
    { role: "user", content: text },
  ];

  let model = cachedModel || (opts?.model || "").trim() || process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  let useJson = true;
  let res = await chat(apiKey, model, messages, useJson);

  if (res.status === 404) {
    const ids = await listModels(apiKey);
    const picked = pickModel(ids);
    if (!picked) {
      throw new Error(ids.length ? `None of your Groq models are chat-capable. Your key has: ${ids.join(", ")}` : `Groq returned no models for your key. Check it at console.groq.com.`);
    }
    console.log(`[groq] "${model}" not available; using "${picked}".`);
    cachedModel = picked;
    model = picked;
    res = await chat(apiKey, model, messages, useJson);
  }

  if (res.status === 400) {
    const body = await res.clone().text();
    if (/response_format|json/i.test(body)) { useJson = false; res = await chat(apiKey, model, messages, useJson); }
  }

  if (!res.ok) throw new Error(`Groq API ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "{}";

  let parsed: { entries?: unknown };
  try { parsed = JSON.parse(content); }
  catch { const m = content.match(/\{[\s\S]*\}/); if (!m) throw new Error("AI returned invalid JSON"); parsed = JSON.parse(m[0]); }

  const rawEntries = Array.isArray((parsed as { entries?: unknown }).entries) ? ((parsed as { entries: unknown[] }).entries) : [];

  return rawEntries
    .map((raw) => {
      const e = raw as Record<string, unknown>;
      const type = (TYPES.includes(String(e.type)) ? String(e.type) : "expense") as ParsedEntry["type"];
      const amount = Number(e.amount);
      let bucket: ParsedEntry["bucket"] = null;
      if (type === "expense") bucket = BUCKETS.includes(String(e.bucket)) ? (String(e.bucket) as ParsedEntry["bucket"]) : "Needs";
      const categoryName = typeof e.categoryName === "string" && e.categoryName.trim() ? e.categoryName.trim() : null;
      return {
        type, amount,
        categoryName: type === "lending" || type === "repayment" ? null : categoryName,
        bucket,
        description: e.description ? String(e.description) : null,
        notes: e.notes ? String(e.notes) : null,
      } as ParsedEntry;
    })
    .filter((e) => Number.isFinite(e.amount) && e.amount > 0);
}
