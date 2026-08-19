// One-time script to backfill email addresses for existing users.
// Run: npx tsx scripts/seed-emails.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL_MAP: { name: string; email: string }[] = [
  { name: "ささとも",           email: "tomoki.sasaki@sap.com" },
  { name: "りんたろう",         email: "rintaro.tanaka@sap.com" },
  { name: "りくと",             email: "rikuto.morishima@sap.com" },
  { name: "きっしー",           email: "naoki.kishida@sap.com" },
  { name: "田中渓より早起き男", email: "yuma.sasaki@sap.com" },
  { name: "かずと",             email: "kazuto.sugai@sap.com" },
  { name: "けん",               email: "ken.yasukawa@sap.com" },
  { name: "かなと",             email: "kanato.hirakawa@sap.com" },
];

async function main() {
  console.log("Seeding emails...");
  for (const { name, email } of EMAIL_MAP) {
    const user = await prisma.user.findUnique({ where: { name } });
    if (!user) {
      console.log(`  SKIP — user not found: ${name}`);
      continue;
    }
    await prisma.user.update({ where: { name }, data: { email } });
    console.log(`  OK   — ${name} → ${email}`);
  }
}

main()
  .then(() => { console.log("Done."); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
