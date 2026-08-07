import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/activity?limit=5&userId=...
// Returns recent approved runs with runner info and reaction counts.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 5), 20);
  const userId = searchParams.get("userId") ?? null;

  // Try with reactions first; fall back to without if Reaction table doesn't exist yet.
  try {
    const runs = await prisma.run.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        laps: true,
        date: true,
        createdAt: true,
        runner: { select: { id: true, name: true, photo: true } },
        reactions: { select: { userId: true } },
      },
    });

    return NextResponse.json(
      runs.map((r) => ({
        id: r.id,
        laps: r.laps,
        date: r.date,
        createdAt: r.createdAt,
        runner: r.runner,
        reactionCount: r.reactions.length,
        myReaction: userId ? r.reactions.some((rx) => rx.userId === userId) : false,
      }))
    );
  } catch {
    // Reaction table not yet migrated — return without reaction data.
    const runs = await prisma.run.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        laps: true,
        date: true,
        createdAt: true,
        runner: { select: { id: true, name: true, photo: true } },
      },
    });

    return NextResponse.json(
      runs.map((r) => ({
        id: r.id,
        laps: r.laps,
        date: r.date,
        createdAt: r.createdAt,
        runner: r.runner,
        reactionCount: 0,
        myReaction: false,
      }))
    );
  }
}
