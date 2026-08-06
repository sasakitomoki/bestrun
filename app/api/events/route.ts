import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

// GET /api/events?upcoming=true  → 今日以降のイベント一覧（参加者情報付き）
// GET /api/events                → 全イベント（オーナー管理用）
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming") === "true";
  const userId = searchParams.get("userId");

  const where = upcoming
    ? { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
    : {};

  const events = await prisma.event.findMany({
    where,
    orderBy: { date: "asc" },
    include: {
      attendees: {
        include: { user: { select: { id: true, name: true, photo: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  return NextResponse.json(
    events.map((e) => ({
      ...e,
      isAttending: userId
        ? e.attendees.some((a) => a.userId === userId)
        : false,
    }))
  );
}

// POST /api/events  → イベント作成（オーナーのみ）
export async function POST(req: Request) {
  let body: {
    requesterName?: unknown;
    title?: unknown;
    date?: unknown;
    timeLabel?: unknown;
    location?: unknown;
    description?: unknown;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 }); }

  if (!isOwner(body.requesterName as string)) {
    return NextResponse.json({ error: "オーナーのみ実行できます。" }, { status: 403 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const dateStr = typeof body.date === "string" ? body.date : "";
  if (!title) return NextResponse.json({ error: "タイトルは必須です。" }, { status: 400 });

  const date = dateStr ? new Date(dateStr) : null;
  if (!date || isNaN(date.getTime())) {
    return NextResponse.json({ error: "日付が不正です。" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title,
      date,
      timeLabel: typeof body.timeLabel === "string" ? body.timeLabel.trim() || null : null,
      location:  typeof body.location  === "string" ? body.location.trim()  || null : null,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
