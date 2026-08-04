const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({ select: { id: true, name: true } });
  for (const u of users) {
    const runs = await p.run.findMany({
      where: { runnerId: u.id, status: "APPROVED" },
      select: { laps: true },
    });
    const achievements = await p.achievement.findMany({
      where: { userId: u.id },
      select: { badgeId: true },
    });
    console.log(`[${u.name}] ${runs.length}件 ${runs.reduce((s,r)=>s+r.laps,0)}周 → バッジ: ${achievements.map(a=>a.badgeId).join(", ") || "なし"}`);
  }
}
main().catch(console.error).finally(() => p.$disconnect());
