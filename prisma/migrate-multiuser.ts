// One-off: assign all pre-existing (userId = null) rows to your account.
// Run AFTER `npm run db:push`:  npx tsx prisma/migrate-multiuser.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!user) { console.log("No account yet. Register at /register first, then re-run this."); return; }

  const c = await prisma.category.updateMany({ where: { userId: null }, data: { userId: user.id } });
  const r = await prisma.recurringItem.updateMany({ where: { userId: null }, data: { userId: user.id } });
  const t = await prisma.transaction.updateMany({ where: { userId: null }, data: { userId: user.id } });
  const s = await prisma.setting.updateMany({ where: { userId: null }, data: { userId: user.id } });

  console.log(`Backfilled to ${user.email}: ${c.count} categories, ${r.count} recurring, ${t.count} transactions, ${s.count} settings.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
