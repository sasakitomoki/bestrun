import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monthRange, currentMonthValue } from "@/lib/distance";

export const dynamic = "force-dynamic";

// GET /api/goals?userId=...&month=YYYY-MM
// Returns { goal: { targetLaps } | null, achievedLaps: number }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const month = searchParams.get("month") || currentMonthValue();

  if (!userId) {
    return NextResponse.json({ error: "userId が必要です。" }, { status: 400 });
  }

  const range = monthRange(month);
  if (!range) {
    return NextResponse.json({ error: "month は YYYY-MM 形式で指定してください。" }, { status: 400 });
  }

  const [year, mon] = month.split("-").map(Number);

  const [goal, runs] = await Promise.all([
    prisma.goal.findUnique({ where: { userId_year_month: { userId, year, month: mon } } }),
    prisma.run.findMany({
      where: { runnerId: userId, status: "APPROVED", date: { gte: range.start, lt: range.end } },
      select: { laps: true },
    }),
  ]);

  const achievedLaps = runs.reduce((sum, r) => sum + r.laps, 0);

  return NextResponse.json({ goal, achievedLaps });
}

// PUT /api/goals -> upsert a goal { userId, month: "YYYY-MM", targetLaps }
export async function PUT(req: Request) {
  let body: { userId?: unknown; month?: unknown; targetLaps?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId : "";
  const month = typeof body.month === "string" ? body.month : "";
  const targetLaps = Number(body.targetLaps);

  if (!userId) return NextResponse.json({ error: "userId が必要です。" }, { status: 400 });
  if (!Number.isInteger(targetLaps) || targetLaps < 1 || targetLaps > 999) {
    return NextResponse.json({ error: "目標周回数は1〜999の整数で入力してください。" }, { status: 400 });
  }

  const range = monthRange(month);
  if (!range) {
    return NextResponse.json({ error: "month は YYYY-MM 形式で指定してください。" }, { status: 400 });
  }

  const [year, mon] = month.split("-").map(Number);

  const goal = await prisma.goal.upsert({
    where: { userId_year_month: { userId, year, month: mon } },
    create: { userId, year, month: mon, targetLaps },
    update: { targetLaps },
  });

  return NextResponse.json(goal);
}
