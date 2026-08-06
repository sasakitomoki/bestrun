import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monthRange, currentMonthValue, lapsToKm } from "@/lib/distance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonthValue();

  const range = monthRange(month);
  if (!range) {
    return NextResponse.json(
      { error: "month は YYYY-MM 形式で指定してください。" },
      { status: 400 }
    );
  }

  // Fetch approved runs and all users in parallel.
  const [runs, allUsers] = await Promise.all([
    prisma.run.findMany({
      where: { status: "APPROVED", date: { gte: range.start, lt: range.end } },
      include: {
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

  // Aggregate laps by runner.
  const byUser = new Map<
    string,
    {
      userId: string;
      name: string;
      photo: string | null;
      selectedBadgeId: string | null;
      statusMessage: string | null;
      motivation: string | null;
      laps: number;
      runCount: number;
    }
  >();

  for (const run of runs) {
    const key = run.runnerId;
    const entry = byUser.get(key);
    if (entry) {
      entry.laps += run.laps;
      entry.runCount += 1;
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
      });
    }
  }

  // Users with at least 1 lap — ranked.
  const ranked = Array.from(byUser.values())
    .map((e) => ({ ...e, km: lapsToKm(e.laps), rank: 0 }))
    .sort((a, b) => b.laps - a.laps || a.name.localeCompare(b.name))
    .map((e, i) => ({ ...e, rank: i + 1 }));

  // Users with 0 laps — not ranked (rank: null).
  const zeroLap = allUsers
    .filter((u) => !byUser.has(u.id))
    .map((u) => ({
      userId: u.id,
      name: u.name,
      photo: u.photo,
      selectedBadgeId: u.selectedBadgeId,
      statusMessage: u.statusMessage,
      motivation: u.motivation,
      laps: 0,
      km: 0,
      runCount: 0,
      rank: null,
    }));

  return NextResponse.json({ month, ranking: [...ranked, ...zeroLap] });
}
