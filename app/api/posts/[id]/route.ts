import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const requesterName = searchParams.get("requesterName") ?? "";
  if (!isOwner(requesterName)) {
    return NextResponse.json({ error: "オーナーのみ削除できます。" }, { status: 403 });
  }
  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
