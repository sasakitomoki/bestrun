import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/events/[id]/attend  → 参加登録 { userId }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: { userId?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 }); }

  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return NextResponse.json({ error: "userId が必要です。" }, { status: 400 });

  const attendee = await prisma.eventAttendee.upsert({
    where: { eventId_userId: { eventId: params.id, userId } },
    create: { eventId: params.id, userId },
    update: {},
  });

  return NextResponse.json(attendee, { status: 201 });
}

// DELETE /api/events/[id]/attend?userId=...  → 参加取り消し
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId が必要です。" }, { status: 400 });

  await prisma.eventAttendee.deleteMany({
    where: { eventId: params.id, userId },
  });

  return new NextResponse(null, { status: 204 });
}
