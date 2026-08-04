// Backfill achievements for all existing approved runs.
// Safe to run multiple times (skipDuplicates: true).
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const BADGES_DEF = [
  { id: "first_step",     check: ({ totalRuns }) => totalRuns >= 1 },
  { id: "rookie",         check: ({ totalLaps }) => totalLaps >= 5 },
  { id: "veteran",        check: ({ totalLaps }) => totalLaps >= 20 },
  { id: "legend",         check: ({ totalLaps }) => totalLaps >= 30 },
  { id: "master",         check: ({ totalLaps }) => totalLaps >= 50 },
  { id: "long_runner",    check: ({ maxSingleLaps }) => maxSingleLaps >= 5 },
  { id: "summer_warrior", check: ({ maxTemp }) => maxTemp !== null && maxTemp >= 30 },
  { id: "heat_god",       check: ({ maxTemp }) => maxTemp !== null && maxTemp >= 35 },
  { id: "cold_runner",    check: ({ minTemp }) => minTemp !== null && minTemp <= 10 },
  { id: "ice_warrior",    check: ({ minTemp }) => minTemp !== null && minTemp <= 5 },
];

async function main() {
  const users = await p.user.findMany({ select: { id: true, name: true } });

  for (const u of users) {
    const runs = await p.run.findMany({
      where: { runnerId: u.id, status: "APPROVED" },
      orderBy: { date: "asc" },
      select: { laps: true, weatherTemp: true, date: true },
    });

    if (runs.length === 0) continue;

    const totalLaps = runs.reduce((s, r) => s + r.laps, 0);
    const totalRuns = runs.length;
    const maxSingleLaps = Math.max(...runs.map(r => r.laps));
    const temps = runs.map(r => r.weatherTemp).filter(t => t !== null);
    const maxTemp = temps.length > 0 ? Math.max(...temps) : null;
    const minTemp = temps.length > 0 ? Math.min(...temps) : null;

    const ctx = { totalLaps, totalRuns, maxSingleLaps, maxTemp, minTemp };
    const toAward = BADGES_DEF.filter(b => b.check(ctx)).map(b => b.id);

    if (toAward.length === 0) {
      console.log(`${u.name}: 対象バッジなし`);
      continue;
    }

    const result = await p.achievement.createMany({
      data: toAward.map(badgeId => ({ userId: u.id, badgeId })),
      skipDuplicates: true,
    });

    // Auto-select the highest milestone badge if no badge selected yet.
    const user = await p.user.findUnique({ where: { id: u.id }, select: { selectedBadgeId: true } });
    if (!user.selectedBadgeId && toAward.length > 0) {
      await p.user.update({
        where: { id: u.id },
        data: { selectedBadgeId: toAward[toAward.length - 1] },
      });
    }

    console.log(`${u.name}: ${result.count}件付与 [${toAward.join(", ")}]`);
  }
  console.log("\n完了");
}
main().catch(console.error).finally(() => p.$disconnect());
