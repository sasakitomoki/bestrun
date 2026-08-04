import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateBadges, BADGE_MAP } from "@/lib/badges";
import type { BadgeId } from "@/lib/badges";
import { notifyRunApproved, notifyBadgeEarned, notifyRankingChanged } from "@/lib/notify";
import { lapsToKm, currentMonthValue, monthRange } from "@/lib/distance";

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

  const newBadges: BadgeId[] = [];

  if (action === "APPROVE") {
    const runnerId = run.runnerId;

    const allApproved = await prisma.run.findMany({
      where: { runnerId, status: "APPROVED" },
      select: { laps: true },
    });
    const totalLaps = allApproved.reduce((s, r) => s + r.laps, 0);
    const totalApprovedRuns = allApproved.length;

    const existing = await prisma.achievement.findMany({
      where: { userId: runnerId },
      select: { badgeId: true },
    });
    const earnedSet = new Set(existing.map((a) => a.badgeId));

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
      await prisma.user.update({
        where: { id: runnerId },
        data: { selectedBadgeId: toAward[toAward.length - 1] },
      });
      newBadges.push(...toAward);
    }

    // Fire notifications non-blocking so they don't slow down the response.
    const [runner, approverUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: runnerId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: approverId }, select: { name: true } }),
    ]);

    if (runner && approverUser) {
      // #2 承認完了通知
      notifyRunApproved({
        approverName: approverUser.name,
        runnerName: runner.name,
        laps: run.laps,
        km: lapsToKm(run.laps),
        totalLaps,
      }).catch(() => {});

      // #3 バッジ獲得通知
      if (toAward.length > 0) {
        const badges = toAward.map((id) => BADGE_MAP[id]).filter(Boolean);
        notifyBadgeEarned({ userName: runner.name, badges }).catch(() => {});
      }

      // #4 首位交代通知（当月のランキングを再計算）
      const month = currentMonthValue();
      const range = monthRange(month)!;
      const monthRuns = await prisma.run.findMany({
        where: { status: "APPROVED", date: { gte: range.start, lt: range.end } },
        select: { runnerId: true, laps: true },
      });
      const byUser = new Map<string, number>();
      for (const r of monthRuns) {
        byUser.set(r.runnerId, (byUser.get(r.runnerId) ?? 0) + r.laps);
      }
      const sorted = [...byUser.entries()].sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0 && sorted[0][0] === runnerId) {
        // Runner is now #1 — notify only if they just moved into first place.
        const wasFirst = sorted.length < 2 || sorted[1][0] === runnerId;
        if (!wasFirst) {
          notifyRankingChanged({
            newLeaderName: runner.name,
            laps: sorted[0][1],
          }).catch(() => {});
        }
      }
    }
  }

  return NextResponse.json({ run: updated, newBadges });
}
