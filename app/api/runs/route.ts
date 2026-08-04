import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/runs -> submit a run request.
// body: { runnerId, approverId, date, laps, weatherTemp?, weatherCode? }
export async function POST(req: Request) {
  let body: {
    runnerId?: unknown;
    approverId?: unknown;
    date?: unknown;
    laps?: unknown;
    weatherTemp?: unknown;
    weatherCode?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const runnerId = typeof body.runnerId === "string" ? body.runnerId : "";
  const approverId = typeof body.approverId === "string" ? body.approverId : "";
  const laps = Number(body.laps);
  const dateStr = typeof body.date === "string" ? body.date : "";
  const weatherTemp = typeof body.weatherTemp === "number" ? body.weatherTemp : null;
  const weatherCode = typeof body.weatherCode === "number" ? body.weatherCode : null;

  if (!runnerId || !approverId) {
    return NextResponse.json(
      { error: "申請者と承認者を指定してください。" },
      { status: 400 }
    );
  }
  if (runnerId === approverId) {
    return NextResponse.json(
      { error: "承認者には自分以外を選択してください。" },
      { status: 400 }
    );
  }
  if (!Number.isInteger(laps) || laps < 1 || laps > 100) {
    return NextResponse.json(
      { error: "周回数は1〜100の整数で入力してください。" },
      { status: 400 }
    );
  }

  const date = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "日付が不正です。" }, { status: 400 });
  }

  // Ensure both users exist.
  const users = await prisma.user.findMany({
    where: { id: { in: [runnerId, approverId] } },
    select: { id: true },
  });
  if (users.length !== 2) {
    return NextResponse.json(
      { error: "指定されたユーザーが見つかりません。" },
      { status: 404 }
    );
  }

  const run = await prisma.run.create({
    data: { runnerId, approverId, date, laps, status: "PENDING", weatherTemp, weatherCode },
  });

  return NextResponse.json(run, { status: 201 });
}

// GET /api/runs?runnerId=... -> a user's own submitted runs (history).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const runnerId = searchParams.get("runnerId");
  if (!runnerId) {
    return NextResponse.json(
      { error: "runnerId が必要です。" },
      { status: 400 }
    );
  }

  const runs = await prisma.run.findMany({
    where: { runnerId },
    orderBy: { date: "desc" },
    include: {
      approver: { select: { id: true, name: true, photo: true } },
    },
  });

  return NextResponse.json(runs);
}
