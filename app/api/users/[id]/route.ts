import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

// GET /api/users/[id] -> public profile for ranking modal.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, photo: true,
      selectedBadgeId: true, statusMessage: true, motivation: true,
      achievements: { select: { badgeId: true, earnedAt: true }, orderBy: { earnedAt: "asc" } },
      runs: {
        where: { status: "APPROVED" },
        select: { laps: true, date: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  }

  const totalLaps = user.runs.reduce((s, r) => s + r.laps, 0);

  return NextResponse.json({
    id: user.id,
    name: user.name,
    photo: user.photo,
    selectedBadgeId: user.selectedBadgeId,
    statusMessage: user.statusMessage,
    motivation: user.motivation,
    achievements: user.achievements,
    totalLaps,
    totalRuns: user.runs.length,
  });
}

// PATCH /api/users/[id] -> update name, photo, selectedBadgeId, statusMessage, motivation.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: {
    name?: unknown;
    photo?: unknown;
    selectedBadgeId?: unknown;
    statusMessage?: unknown;
    motivation?: unknown;
  };
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
  const selectedBadgeId =
    body.selectedBadgeId === null
      ? null
      : typeof body.selectedBadgeId === "string"
      ? body.selectedBadgeId
      : undefined;
  const statusMessage =
    body.statusMessage === null
      ? null
      : typeof body.statusMessage === "string"
      ? body.statusMessage.slice(0, 50)
      : undefined;
  const motivation =
    body.motivation === null
      ? null
      : typeof body.motivation === "string"
      ? body.motivation
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
      ...(statusMessage !== undefined ? { statusMessage } : {}),
      ...(motivation !== undefined ? { motivation } : {}),
    },
    select: { id: true, name: true, photo: true, selectedBadgeId: true, statusMessage: true, motivation: true },
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
