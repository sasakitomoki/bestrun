import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

// PATCH /api/users/[id] -> update name, photo, and/or selectedBadgeId.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: { name?: unknown; photo?: unknown; selectedBadgeId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const userId = params.id;
  const name = typeof body.name === "string" ? body.name.trim() : null;
  const photo =
    body.photo === null
      ? null
      : typeof body.photo === "string" && body.photo.length > 0
      ? body.photo
      : undefined;
  // null = clear badge, string = set badge, undefined = no change
  const selectedBadgeId =
    body.selectedBadgeId === null
      ? null
      : typeof body.selectedBadgeId === "string"
      ? body.selectedBadgeId
      : undefined;

  if (name !== null) {
    if (name.length === 0) {
      return NextResponse.json({ error: "ユーザー名を入力してください。" }, { status: 400 });
    }
    if (name.length > 30) {
      return NextResponse.json({ error: "ユーザー名は30文字以内で入力してください。" }, { status: 400 });
    }
    const conflict = await prisma.user.findFirst({
      where: { name, NOT: { id: userId } },
    });
    if (conflict) {
      return NextResponse.json({ error: "そのユーザー名は既に使われています。" }, { status: 409 });
    }
  }

  // Verify the badge is actually earned before setting it.
  if (selectedBadgeId) {
    const earned = await prisma.achievement.findUnique({
      where: { userId_badgeId: { userId, badgeId: selectedBadgeId } },
    });
    if (!earned) {
      return NextResponse.json({ error: "そのバッジはまだ獲得していません。" }, { status: 403 });
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== null ? { name } : {}),
      ...(photo !== undefined ? { photo } : {}),
      ...(selectedBadgeId !== undefined ? { selectedBadgeId } : {}),
    },
    select: { id: true, name: true, photo: true, selectedBadgeId: true },
  });

  return NextResponse.json(user);
}

// DELETE /api/users/[id]?requesterName=<owner name>
// Owner can delete any user (cascade deletes their runs too).
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const requesterName = searchParams.get("requesterName");

  if (!isOwner(requesterName)) {
    return NextResponse.json({ error: "オーナーのみ実行できます。" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  }
  if (isOwner(target.name)) {
    return NextResponse.json({ error: "オーナー自身は削除できません。" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
