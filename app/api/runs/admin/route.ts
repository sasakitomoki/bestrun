import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monthRange, currentMonthValue } from "@/lib/distance";

export const dynamic = "force-dynamic";

// GET /api/runs/admin?month=YYYY-MM
// Returns all runs (any status) for the given month, for owner use.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonthValue();
  const range = monthRange(month);
  if (!range) {
    return NextResponse.json(
      { error: "month は YYYY-MM 形式で指定してください。" },
      { status: 400 }
    );
  }

  const runs = await prisma.run.findMany({
    where: { date: { gte: range.start, lt: range.end } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      runner: { select: { id: true, name: true, photo: true } },
      approver: { select: { id: true, name: true, photo: true } },
    },
  });

  return NextResponse.json(runs);
}
