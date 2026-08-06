import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

// PATCH /api/events/[id]  → イベント編集（オーナーのみ）
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: {
    requesterName?: unknown;
    title?: unknown;
    date?: unknown;
    startTime?: unknown;
    endTime?: unknown;
    location?: unknown;
    description?: unknown;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 }); }

  if (!isOwner(body.requesterName as string)) {
    return NextResponse.json({ error: "オーナーのみ実行できます。" }, { status: 403 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const dateStr = typeof body.date === "string" ? body.date : undefined;
  const date = dateStr ? new Date(dateStr) : undefined;

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...(title ? { title } : {}),
      ...(date && !isNaN(date.getTime()) ? { date } : {}),
      ...(body.startTime   !== undefined ? { startTime:   (body.startTime   as string) || null } : {}),
      ...(body.endTime     !== undefined ? { endTime:     (body.endTime     as string) || null } : {}),
      ...(body.location    !== undefined ? { location:    (body.location    as string) || null } : {}),
      ...(body.description !== undefined ? { description: (body.description as string) || null } : {}),
    },
  });

  return NextResponse.json(event);
}

// DELETE /api/events/[id]  → イベント削除（オーナーのみ）
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const requesterName = searchParams.get("requesterName");

  if (!isOwner(requesterName)) {
    return NextResponse.json({ error: "オーナーのみ実行できます。" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
