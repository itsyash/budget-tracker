# Budget Tracker

A multi-user personal income & expense tracker with 50 / 30 / 20 analysis, plus an
optional Telegram bot for logging by text. Built with **Next.js 16 (App Router) +
TypeScript + Prisma (SQLite) + Tailwind CSS**.

## Features
- Email/password auth with **env-gated registration** (open / invite / closed).
- Per-user data isolation (every record scoped to its owner).
- Income / expense / **lending** & repayment entries, tagged Needs / Wants / Savings.
- Dashboard: 50/30/20 benchmark cards with per-category breakdowns, charts, outstanding lent.
- Optional **Telegram bot**: log expenses in plain text (parsed by Groq AI), plus `/brief` and `/today`.
- Each user adds their own **Groq AI key** in Settings.

## Setup
Requires **Node.js 18.18+** (20/22 recommended).

```bash
npm install
npm run db:push        # create SQLite DB + generate Prisma client
# optional: create an owner account (otherwise just use /register)
SEED_EMAIL=owner@example.com SEED_PASSWORD=change-me npm run db:seed
npm run dev            # http://localhost:3000
```

Register your account at `/register`, or sign in with the seeded owner above.

## Environment (`.env`)
```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<openssl rand -base64 32>"

# Access control
REGISTRATION_MODE=invite          # open | invite | closed
INVITE_EMAILS=you@example.com      # comma-separated, used when mode=invite

# Telegram bot (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALLOWED_USER_ID=          # your numeric Telegram id
BOT_USER_EMAIL=you@example.com     # which account the bot writes to
GROQ_API_KEY=                      # fallback; users can set their own in Settings
GROQ_MODEL=openai/gpt-oss-20b
```

## Telegram bot
1. Create a bot via **@BotFather**, put the token in `TELEGRAM_BOT_TOKEN`.
2. Get a free Groq key at **console.groq.com** (or let each user add theirs in Settings → AI Key).
3. Run it: `npm run bot`. Then text it e.g. `800 groceries, 90 milk`, or use `/brief` and `/today`.

## Scripts
| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | dev server / prod build / run build |
| `npm run db:push` | apply schema + generate client |
| `npm run db:seed` | create an owner + default categories |
| `npm run db:studio` | browse the DB |
| `npm run bot` | run the Telegram bot |

> The SQLite DB (`prisma/dev.db`) and `.env` are gitignored — no data or secrets are committed.

## Deployment (GCP VM — CI/CD)

Builds run in GitHub Actions (free), artifacts are copied to the VM, and PM2 runs the
web app + Telegram bot. Nothing is built on the VM (keeps a 1 GB `e2-micro` from OOM).

### One-time VM setup
```bash
# Persistent env + DB, OUTSIDE the deploy dir so redeploys never touch them
mkdir -p ~/budget-data
nano ~/budget-data/.env   # DATABASE_URL="file:$HOME/budget-data/prod.db", AUTH_SECRET, bot vars, etc.

# Let PM2 restore processes after a reboot (run once).
pm2 startup
# PM2 prints the exact sudo line to run for your user. On this VM it is:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u <username> --hp /home/<username>
```

Also configure **Nginx** as a reverse proxy to `127.0.0.1:3000`, with a **Let's Encrypt**
certificate — HTTPS is required (the login cookie is `secure` in production).

### GitHub secrets
`VM_HOST`, `VM_USER`, `VM_SSH_KEY` (a deploy **private** key; its public key goes in the
VM's `~/.ssh/authorized_keys`). `VM_USER` must match the user `pm2 startup` was run for.

### Deploying
Push to `main`. `.github/workflows/deploy.yml` builds the standalone output + bundles the
bot, copies artifacts, runs `prisma db push`, and reloads PM2 — all automatically.
After the **first** deploy, register your `BOT_USER_EMAIL` account at the live `/register`
so the bot has an account to write to.
