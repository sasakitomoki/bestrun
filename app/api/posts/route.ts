import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/owner";
import { notifyPostCreated } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  let body: { requesterName?: unknown; title?: unknown; body?: unknown; photo?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 }); }

  const requesterName = typeof body.requesterName === "string" ? body.requesterName : "";
  if (!isOwner(requesterName)) {
    return NextResponse.json({ error: "オーナーのみ投稿できます。" }, { status: 403 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const postBody = typeof body.body === "string" ? body.body.trim() : "";
  const photo = typeof body.photo === "string" && body.photo.length > 0 ? body.photo : null;

  if (!title) return NextResponse.json({ error: "見出しを入力してください。" }, { status: 400 });
  if (!postBody) return NextResponse.json({ error: "コメントを入力してください。" }, { status: 400 });

  const post = await prisma.post.create({ data: { title, body: postBody, photo } });
  notifyPostCreated({ title, body: postBody });
  return NextResponse.json({ post }, { status: 201 });
}
