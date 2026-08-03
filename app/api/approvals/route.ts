import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/approvals?approverId=... -> pending runs awaiting this user's approval.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const approverId = searchParams.get("approverId");
  if (!approverId) {
    return NextResponse.json(
      { error: "approverId が必要です。" },
      { status: 400 }
    );
  }

  const pending = await prisma.run.findMany({
    where: { approverId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      runner: { select: { id: true, name: true, photo: true } },
    },
  });

  return NextResponse.json(pending);
}

// PATCH /api/approvals -> approve or reject a run.
// body: { runId, approverId, action: "APPROVE" | "REJECT" }
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
    return NextResponse.json(
      { error: "runId, approverId, action が必要です。" },
      { status: 400 }
    );
  }

  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: "申請が見つかりません。" }, { status: 404 });
  }
  // Only the designated approver may act, and only on pending requests.
  if (run.approverId !== approverId) {
    return NextResponse.json(
      { error: "この申請を承認する権限がありません。" },
      { status: 403 }
    );
  }
  if (run.status !== "PENDING") {
    return NextResponse.json(
      { error: "この申請は既に処理済みです。" },
      { status: 409 }
    );
  }

  const updated = await prisma.run.update({
    where: { id: runId },
    data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED" },
  });

  return NextResponse.json(updated);
}
