import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/activity?limit=5
// Returns recent approved runs with runner info.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 5), 20);

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

  return NextResponse.json(runs);
}
