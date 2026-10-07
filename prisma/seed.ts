// Fresh seed: creates one owner account + default categories/settings. No personal financial data.
// Override creds:  SEED_EMAIL=... SEED_PASSWORD=... npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { provisionUser } from "../src/lib/defaults";

const prisma = new PrismaClient();
const EMAIL = (process.env.SEED_EMAIL || "owner@example.com").toLowerCase();
const PASSWORD = process.env.SEED_PASSWORD || "changeme123";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.upsert({ where: { email: EMAIL }, update: {}, create: { email: EMAIL, name: "Owner", password: hash } });
  await provisionUser(prisma, user.id);
  console.log(`Seeded owner ${EMAIL} + default categories. Change the password after first login.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
