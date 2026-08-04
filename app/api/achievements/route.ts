import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/achievements?userId=...
// Returns earned badge IDs with earnedAt timestamps.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId が必要です。" }, { status: 400 });
  }

  const achievements = await prisma.achievement.findMany({
    where: { userId },
    orderBy: { earnedAt: "asc" },
    select: { badgeId: true, earnedAt: true },
  });

  return NextResponse.json(achievements);
}
