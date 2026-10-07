// Zero-cost Telegram -> AI -> DB expense logger + summary commands (multi-user aware).
// Writes to one app account (BOT_USER_EMAIL, or the first user). Run:  npm run bot
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { parseWithGroq } from "./parse";
import { provisionUser } from "../src/lib/defaults";

function loadEnv(path = ".env") {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!(m[1] in process.env)) process.env[m[1]] = v;
    }
  } catch { /* no .env */ }
}
loadEnv();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED = (process.env.TELEGRAM_ALLOWED_USER_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
if (!TOKEN) { console.error("TELEGRAM_BOT_TOKEN missing in .env"); process.exit(1); }

const API = `https://api.telegram.org/bot${TOKEN}`;
const prisma = new PrismaClient({ log: ["error"] });

const lastBatch = new Map<number, number[]>();
let cachedUserId: number | null = null;

const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const HELP = [
  "👋 <b>Budget bot</b>. Text me what you spent, e.g.:",
  "<code>800 kirana, 90 milk, 30 sabzi</code>",
  "<code>2000 on clothes today</code>",
  "<code>lent 500 to Rohan for lunch</code>",
  "",
  "<b>Commands</b>",
  "/brief — this month's summary",
  "/today — today's entries",
  "/undo — remove my last additions",
].join("\n");

async function tg(method: string, body: unknown) {
  const r = await fetch(`${API}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}
const send = (chatId: number, text: string) => tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });

async function getBotUserId(): Promise<number> {
  if (cachedUserId) return cachedUserId;
  const email = (process.env.BOT_USER_EMAIL || "").trim().toLowerCase();
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!user) throw new Error("No app account found. Register at /register first (or set BOT_USER_EMAIL in .env).");
  await provisionUser(prisma, user.id);
  cachedUserId = user.id;
  return user.id;
}

async function resolveCategoryId(userId: number, name: string | null, bucket: string | null): Promise<number | null> {
  if (!name) return null;
  const existing = await prisma.category.findFirst({ where: { userId, name } });
  if (existing) return existing.id;
  const created = await prisma.category.create({ data: { userId, name, defaultBucket: bucket ?? "Needs", kind: "expense" } });
  return created.id;
}

async function buildBrief(userId: number): Promise<string> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthLabel = start.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const [setting, incomeAgg, byBucket, byCat, lentAgg, repaidAgg, cats] = await Promise.all([
    prisma.setting.findUnique({ where: { userId } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, type: "income", date: { gte: start, lt: end } } }),
    prisma.transaction.groupBy({ by: ["bucket"], where: { userId, type: "expense", date: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["categoryId"], where: { userId, type: "expense", date: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, type: "lending" } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { userId, type: "repayment" } }),
    prisma.category.findMany({ where: { userId }, select: { id: true, name: true } }),
  ]);

  const rule: Record<string, number> = { Needs: setting?.needsPct ?? 50, Wants: setting?.wantsPct ?? 30, Savings: setting?.savingsPct ?? 20 };
  const income = incomeAgg._sum.amount ?? 0;
  const actual: Record<string, number> = { Needs: 0, Wants: 0, Savings: 0 };
  for (const g of byBucket) if (g.bucket && g.bucket in actual) actual[g.bucket] = g._sum.amount ?? 0;
  const outflow = actual.Needs + actual.Wants + actual.Savings;
  const pct = (n: number) => (income ? `${((n / income) * 100).toFixed(1)}%` : "0%");

  const nameOf = new Map(cats.map((c) => [c.id, c.name]));
  const top = byCat.map((g) => ({ name: g.categoryId != null ? nameOf.get(g.categoryId) ?? "Uncategorized" : "Uncategorized", amount: g._sum.amount ?? 0 }))
    .filter((x) => x.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const outstanding = (lentAgg._sum.amount ?? 0) - (repaidAgg._sum.amount ?? 0);
  const bLine = (emoji: string, b: "Needs" | "Wants" | "Savings") => `${emoji} ${b}: <b>${fmt(actual[b])}</b> / ${fmt((income * rule[b]) / 100)} (${pct(actual[b])})`;

  let msg = `📊 <b>${monthLabel} — Budget Brief</b>\n\n`;
  msg += `💰 Income: <b>${fmt(income)}</b>\n💸 Spent: <b>${fmt(outflow)}</b> (${pct(outflow)})\n🏦 Unspent: <b>${fmt(income - outflow)}</b>\n\n`;
  msg += `<b>By bucket (actual / target)</b>\n${bLine("🟦", "Needs")}\n${bLine("🟪", "Wants")}\n${bLine("🟩", "Savings")}\n`;
  if (top.length) { msg += `\n<b>Top spends</b>\n`; for (const t of top) msg += `• ${esc(t.name)} — ${fmt(t.amount)}\n`; }
  if (outstanding > 0) msg += `\n🤝 Outstanding lent: <b>${fmt(outstanding)}</b>`;
  return msg;
}

async function buildToday(userId: number): Promise<string> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const txs = await prisma.transaction.findMany({ where: { userId, date: { gte: start, lt: end } }, include: { category: true }, orderBy: { id: "desc" } });
  if (!txs.length) return "📅 No entries logged today yet.";
  let spent = 0; const lines: string[] = [];
  for (const t of txs) {
    if (t.type === "expense") spent += t.amount;
    const label = t.description || t.category?.name || t.type;
    const tag = t.type === "expense" ? (t.bucket ? ` (${t.bucket})` : "") : ` (${t.type})`;
    lines.push(`• ${fmt(t.amount)} — ${esc(label)}${tag}`);
  }
  return `📅 <b>Today</b>\n${lines.join("\n")}\n\nSpent today: <b>${fmt(spent)}</b>`;
}

async function handleMessage(msg: any) {
  const chatId: number = msg.chat.id;
  const fromId = String(msg.from?.id ?? "");
  if (ALLOWED.length && !ALLOWED.includes(fromId)) {
    await send(chatId, `⛔ Not authorized. Your Telegram id is <code>${fromId}</code> — set TELEGRAM_ALLOWED_USER_ID to it in .env.`);
    return;
  }

  const text = String(msg.text || "").trim();
  if (!text) return;
  if (text === "/start" || text === "/help") { await send(chatId, HELP); return; }

  let userId: number;
  try { userId = await getBotUserId(); }
  catch (e) { await send(chatId, `⚠️ ${e instanceof Error ? e.message : "No account."}`); return; }

  if (text === "/brief" || text === "/summary" || text === "/month") { await send(chatId, await buildBrief(userId)); return; }
  if (text === "/today") { await send(chatId, await buildToday(userId)); return; }

  if (text === "/undo") {
    const ids = lastBatch.get(chatId) || [];
    if (!ids.length) { await send(chatId, "Nothing to undo."); return; }
    await prisma.transaction.deleteMany({ where: { id: { in: ids }, userId } });
    lastBatch.delete(chatId);
    await send(chatId, `🗑 Removed ${ids.length} entr${ids.length > 1 ? "ies" : "y"}.`);
    return;
  }

  let entries;
  try {
    const cats = await prisma.category.findMany({ where: { userId }, select: { name: true, defaultBucket: true, kind: true } });
    const setting = await prisma.setting.findUnique({ where: { userId } }); entries = await parseWithGroq(text, cats, { apiKey: setting?.groqApiKey, model: setting?.groqModel });
  } catch (e) {
    await send(chatId, `⚠️ ${e instanceof Error ? e.message : "Could not parse that."}`);
    return;
  }
  if (!entries.length) { await send(chatId, "I couldn't find an amount. Try: <code>800 kirana, 90 milk</code>"); return; }

  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const ids: number[] = []; const lines: string[] = [];
  for (const e of entries) {
    const categoryId = e.type === "expense" || e.type === "income" ? await resolveCategoryId(userId, e.categoryName, e.bucket) : null;
    const t = await prisma.transaction.create({ data: { userId, date, type: e.type, categoryId, bucket: e.bucket, description: e.description, amount: e.amount, notes: e.notes } });
    ids.push(t.id);
    const primary = e.description || e.categoryName || e.type;
    const bits: string[] = [];
    if (e.categoryName && e.categoryName !== primary) bits.push(e.categoryName);
    if (e.type === "expense") { if (e.bucket) bits.push(e.bucket); } else bits.push(e.type);
    let line = `• ${fmt(e.amount)} — <b>${esc(primary)}</b>${bits.length ? " · " + esc(bits.join(" · ")) : ""}`;
    if (e.notes) line += `\n   ↳ <i>${esc(e.notes)}</i>`;
    lines.push(line);
  }
  lastBatch.set(chatId, ids);
  const spent = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  await send(chatId, `✅ Added ${entries.length} entr${entries.length > 1 ? "ies" : "y"}:\n${lines.join("\n")}\n\nExpense total: <b>${fmt(spent)}</b>\n/undo to remove.`);
}

async function main() {
  const me = await tg("getMe", {});
  if (!me.ok) { console.error("Bad TELEGRAM_BOT_TOKEN:", me); process.exit(1); }
  await tg("setMyCommands", { commands: [
    { command: "brief", description: "This month's budget summary" },
    { command: "today", description: "Today's entries" },
    { command: "undo", description: "Remove my last additions" },
    { command: "help", description: "How to use" },
  ] });
  console.log(`Bot @${me.result.username} listening…${ALLOWED.length ? ` (locked to ${ALLOWED.length} user(s))` : " (OPEN)"}`);

  let offset = 0;
  const first = await tg("getUpdates", { timeout: 0 });
  if (first.ok && first.result.length) offset = first.result[first.result.length - 1].update_id + 1;

  while (true) {
    try {
      const res = await tg("getUpdates", { offset, timeout: 30 });
      if (res.ok) { for (const u of res.result) { offset = u.update_id + 1; if (u.message) await handleMessage(u.message).catch((err) => console.error("handler error:", err)); } }
      else await sleep(2000);
    } catch (e) { console.error("poll error:", e); await sleep(2000); }
  }
}

main();
