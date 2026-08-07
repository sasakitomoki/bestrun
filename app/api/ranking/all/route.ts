import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lapsToKm } from "@/lib/distance";

export const dynamic = "force-dynamic";

// GET /api/ranking/all
// Returns all-time ranking aggregated across all months.
export async function GET() {
  const [runs, allUsers] = await Promise.all([
    prisma.run.findMany({
      where: { status: "APPROVED" },
      select: {
        runnerId: true,
        laps: true,
        date: true,
        runner: {
          select: {
            id: true, name: true, photo: true,
            selectedBadgeId: true, statusMessage: true, motivation: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      select: {
        id: true, name: true, photo: true,
        selectedBadgeId: true, statusMessage: true, motivation: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Aggregate by user.
  const byUser = new Map<string, {
    userId: string; name: string; photo: string | null;
    selectedBadgeId: string | null; statusMessage: string | null; motivation: string | null;
    laps: number; runCount: number; activeMonths: Set<string>;
  }>();

  for (const run of runs) {
    const key = run.runnerId;
    const monthKey = run.date.toISOString().slice(0, 7); // "YYYY-MM"
    const entry = byUser.get(key);
    if (entry) {
      entry.laps += run.laps;
      entry.runCount += 1;
      entry.activeMonths.add(monthKey);
    } else {
      byUser.set(key, {
        userId: run.runner.id,
        name: run.runner.name,
        photo: run.runner.photo,
        selectedBadgeId: run.runner.selectedBadgeId,
        statusMessage: run.runner.statusMessage,
        motivation: run.runner.motivation,
        laps: run.laps,
        runCount: 1,
        activeMonths: new Set([monthKey]),
      });
    }
  }

  const ranked = Array.from(byUser.values())
    .map((e) => ({
      userId: e.userId,
      name: e.name,
      photo: e.photo,
      selectedBadgeId: e.selectedBadgeId,
      statusMessage: e.statusMessage,
      motivation: e.motivation,
      laps: e.laps,
      km: lapsToKm(e.laps),
      runCount: e.runCount,
      activeMonths: e.activeMonths.size,
    }))
    .sort((a, b) => b.laps - a.laps || a.name.localeCompare(b.name))
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const zeroLap = allUsers
    .filter((u) => !byUser.has(u.id))
    .map((u) => ({
      rank: null,
      userId: u.id, name: u.name, photo: u.photo,
      selectedBadgeId: u.selectedBadgeId, statusMessage: u.statusMessage, motivation: u.motivation,
      laps: 0, km: 0, runCount: 0, activeMonths: 0,
    }));

  return NextResponse.json({ ranking: [...ranked, ...zeroLap] });
}
