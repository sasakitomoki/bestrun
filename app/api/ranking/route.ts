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

  const runs = await prisma.run.findMany({
    where: { status: "APPROVED", date: { gte: range.start, lt: range.end } },
    include: {
      runner: { select: { id: true, name: true, photo: true, selectedBadgeId: true, statusMessage: true, motivation: true } },
    },
  });

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

  const ranking = Array.from(byUser.values())
    .map((e) => ({ ...e, km: lapsToKm(e.laps) }))
    .sort((a, b) => b.laps - a.laps || a.name.localeCompare(b.name))
    .map((e, i) => ({ rank: i + 1, ...e }));

  return NextResponse.json({ month, ranking });
}
