import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: { requesterName?: unknown; title?: unknown; body?: unknown; photo?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 }); }

  const requesterName = typeof body.requesterName === "string" ? body.requesterName.trim() : "";
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
  if (post.authorName !== requesterName && !isOwner(requesterName)) {
    return NextResponse.json({ error: "編集できません。" }, { status: 403 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : post.title;
  const postBody = typeof body.body === "string" ? body.body.trim() : post.body;
  const photo = body.photo === null ? null : (typeof body.photo === "string" && body.photo.length > 0 ? body.photo : post.photo);

  if (!title) return NextResponse.json({ error: "見出しを入力してください。" }, { status: 400 });
  if (!postBody) return NextResponse.json({ error: "コメントを入力してください。" }, { status: 400 });

  const updated = await prisma.post.update({ where: { id: params.id }, data: { title, body: postBody, photo } });
  return NextResponse.json({ post: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const requesterName = searchParams.get("requesterName") ?? "";

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
  if (post.authorName !== requesterName && !isOwner(requesterName)) {
    return NextResponse.json({ error: "削除できません。" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
