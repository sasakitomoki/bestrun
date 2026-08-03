import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

// DELETE /api/runs/[id]?runnerId=...          (runner cancels own PENDING run)
// DELETE /api/runs/[id]?requesterName=<owner> (owner deletes any run)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const runnerId = searchParams.get("runnerId");
  const requesterName = searchParams.get("requesterName");
  const runId = params.id;

  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: "申請が見つかりません。" }, { status: 404 });
  }

  if (isOwner(requesterName)) {
    // Owner can delete any run regardless of status.
    await prisma.run.delete({ where: { id: runId } });
    return new NextResponse(null, { status: 204 });
  }

  if (!runnerId) {
    return NextResponse.json({ error: "runnerId が必要です。" }, { status: 400 });
  }
  if (run.runnerId !== runnerId) {
    return NextResponse.json({ error: "この申請を削除する権限がありません。" }, { status: 403 });
  }
  if (run.status !== "PENDING") {
    return NextResponse.json(
      { error: "承認済み・否認済みの申請は取り消せません。" },
      { status: 409 }
    );
  }

  await prisma.run.delete({ where: { id: runId } });
  return new NextResponse(null, { status: 204 });
}

// PATCH /api/runs/[id] -> owner updates laps and/or status.
// body: { requesterName, laps?, status? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: { requesterName?: unknown; laps?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const requesterName =
    typeof body.requesterName === "string" ? body.requesterName : "";

  if (!isOwner(requesterName)) {
    return NextResponse.json({ error: "オーナーのみ実行できます。" }, { status: 403 });
  }

  const run = await prisma.run.findUnique({ where: { id: params.id } });
  if (!run) {
    return NextResponse.json({ error: "申請が見つかりません。" }, { status: 404 });
  }

  const laps = body.laps !== undefined ? Number(body.laps) : undefined;
  const status =
    body.status === "PENDING" || body.status === "APPROVED" || body.status === "REJECTED"
      ? body.status
      : undefined;

  if (laps !== undefined && (!Number.isInteger(laps) || laps < 1 || laps > 100)) {
    return NextResponse.json(
      { error: "周回数は1〜100の整数で入力してください。" },
      { status: 400 }
    );
  }

  const updated = await prisma.run.update({
    where: { id: params.id },
    data: {
      ...(laps !== undefined ? { laps } : {}),
      ...(status !== undefined ? { status } : {}),
    },
    include: {
      runner: { select: { id: true, name: true, photo: true } },
      approver: { select: { id: true, name: true, photo: true } },
    },
  });

  return NextResponse.json(updated);
}
