import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateBadges } from "@/lib/badges";
import type { BadgeId } from "@/lib/badges";

export const dynamic = "force-dynamic";

// GET /api/approvals?approverId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const approverId = searchParams.get("approverId");
  if (!approverId) {
    return NextResponse.json({ error: "approverId が必要です。" }, { status: 400 });
  }

  const pending = await prisma.run.findMany({
    where: { approverId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { runner: { select: { id: true, name: true, photo: true } } },
  });

  return NextResponse.json(pending);
}

// PATCH /api/approvals -> approve or reject a run.
// Returns { run, newBadges: Badge[] } so the client can show toast notifications.
export async function PATCH(req: Request) {
  let body: { runId?: unknown; approverId?: unknown; action?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const runId = typeof body.runId === "string" ? body.runId : "";
  const approverId = typeof body.approverId === "string" ? body.approverId : "";
  const action = body.action === "APPROVE" || body.action === "REJECT" ? body.action : null;

  if (!runId || !approverId || !action) {
    return NextResponse.json({ error: "runId, approverId, action が必要です。" }, { status: 400 });
  }

  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) return NextResponse.json({ error: "申請が見つかりません。" }, { status: 404 });
  if (run.approverId !== approverId) {
    return NextResponse.json({ error: "この申請を承認する権限がありません。" }, { status: 403 });
  }
  if (run.status !== "PENDING") {
    return NextResponse.json({ error: "この申請は既に処理済みです。" }, { status: 409 });
  }

  const updated = await prisma.run.update({
    where: { id: runId },
    data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED" },
  });

  // Award badges only on approval.
  const newBadges: BadgeId[] = [];
  if (action === "APPROVE") {
    const runnerId = run.runnerId;

    // Fetch all approved runs for this runner (including the just-approved one).
    const allApproved = await prisma.run.findMany({
      where: { runnerId, status: "APPROVED" },
      select: { laps: true },
    });
    const totalLaps = allApproved.reduce((s, r) => s + r.laps, 0);
    const totalApprovedRuns = allApproved.length;

    // Already-earned badge IDs.
    const existing = await prisma.achievement.findMany({
      where: { userId: runnerId },
      select: { badgeId: true },
    });
    const earnedSet = new Set(existing.map((a) => a.badgeId));

    // Evaluate which badges should now be awarded.
    const candidates = evaluateBadges({
      totalApprovedRuns,
      totalLaps,
      currentLaps: run.laps,
      weatherTemp: run.weatherTemp,
    });

    const toAward = candidates.filter((id) => !earnedSet.has(id));

    if (toAward.length > 0) {
      await prisma.achievement.createMany({
        data: toAward.map((badgeId) => ({ userId: runnerId, badgeId })),
        skipDuplicates: true,
      });
      // Auto-select the most recently earned badge (last in toAward list).
      await prisma.user.update({
        where: { id: runnerId },
        data: { selectedBadgeId: toAward[toAward.length - 1] },
      });
      newBadges.push(...toAward);
    }
  }

  return NextResponse.json({ run: updated, newBadges });
}
