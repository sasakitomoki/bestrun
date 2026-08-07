import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/reactions  { runId, userId } → add reaction
export async function POST(req: Request) {
  let body: { runId?: unknown; userId?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 }); }

  const runId = typeof body.runId === "string" ? body.runId : "";
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!runId || !userId) {
    return NextResponse.json({ error: "runId と userId が必要です。" }, { status: 400 });
  }

  const run = await prisma.run.findUnique({ where: { id: runId }, select: { runnerId: true } });
  if (!run) return NextResponse.json({ error: "ランが見つかりません。" }, { status: 404 });
  if (run.runnerId === userId) {
    return NextResponse.json({ error: "自分のランには称賛できません。" }, { status: 400 });
  }

  await prisma.reaction.upsert({
    where: { runId_userId: { runId, userId } },
    create: { runId, userId },
    update: {},
  });

  const count = await prisma.reaction.count({ where: { runId } });
  return NextResponse.json({ count }, { status: 201 });
}

// DELETE /api/reactions?runId=...&userId=... → remove reaction
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId") ?? "";
  const userId = searchParams.get("userId") ?? "";
  if (!runId || !userId) {
    return NextResponse.json({ error: "runId と userId が必要です。" }, { status: 400 });
  }

  await prisma.reaction.deleteMany({ where: { runId, userId } });
  const count = await prisma.reaction.count({ where: { runId } });
  return NextResponse.json({ count });
}
