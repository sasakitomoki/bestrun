import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateBadges, BADGE_MAP } from "@/lib/badges";
import type { BadgeId } from "@/lib/badges";
import { notifyBadgeEarned, notifyRankingChanged } from "@/lib/notify";
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
      // #3 バッジ獲得通知
      if (toAward.length > 0) {
        const badges = toAward.map((id) => BADGE_MAP[id]).filter(Boolean);
        notifyBadgeEarned({ userName: runner.name, badges }).catch(() => {});
      }

      // #4 首位交代通知
      // 承認後の全ランで集計し、「承認前の1位」と「承認後の1位」を比較。
      // 異なるユーザーに入れ替わったときのみ通知する。
      const month = currentMonthValue();
      const range = monthRange(month)!;
      const monthRuns = await prisma.run.findMany({
        where: { status: "APPROVED", date: { gte: range.start, lt: range.end } },
        select: { runnerId: true, laps: true },
      });

      // 今回承認したランを除いた「承認前」のランキング
      const beforeMap = new Map<string, number>();
      for (const r of monthRuns) {
        if (r.runnerId === runnerId) {
          // 今回分を差し引く
          const prev = (beforeMap.get(r.runnerId) ?? 0) + r.laps;
          beforeMap.set(r.runnerId, prev);
        } else {
          beforeMap.set(r.runnerId, (beforeMap.get(r.runnerId) ?? 0) + r.laps);
        }
      }
      // 今回のrunのlapsを差し引いて承認前の状態に戻す
      const beforeRunnerLaps = (beforeMap.get(runnerId) ?? 0) - run.laps;
      if (beforeRunnerLaps <= 0) {
        beforeMap.delete(runnerId);
      } else {
        beforeMap.set(runnerId, beforeRunnerLaps);
      }
      const beforeLeader = [...beforeMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      // 承認後のランキング
      const afterMap = new Map<string, number>();
      for (const r of monthRuns) {
        afterMap.set(r.runnerId, (afterMap.get(r.runnerId) ?? 0) + r.laps);
      }
      const afterSorted = [...afterMap.entries()].sort((a, b) => b[1] - a[1]);
      const afterLeader = afterSorted[0]?.[0] ?? null;

      // 1位が別のユーザーに入れ替わったときだけ通知
      if (afterLeader === runnerId && afterLeader !== beforeLeader) {
        notifyRankingChanged({
          newLeaderName: runner.name,
          laps: afterSorted[0][1],
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ run: updated, newBadges });
}
