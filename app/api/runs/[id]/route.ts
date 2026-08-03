import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// DELETE /api/runs/[id]?runnerId=...
// Allows a runner to cancel their own PENDING run only.
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const runnerId = searchParams.get("runnerId");
  const runId = params.id;

  if (!runnerId) {
    return NextResponse.json({ error: "runnerId が必要です。" }, { status: 400 });
  }

  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: "申請が見つかりません。" }, { status: 404 });
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
