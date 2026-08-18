import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAvatarDataUrl } from "@/lib/avatar";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: unknown; otp?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 }); }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";

  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
  if (!pending) {
    return NextResponse.json({ error: "認証情報が見つかりません。最初からやり直してください。" }, { status: 404 });
  }
  if (new Date() > pending.expiresAt) {
    await prisma.pendingRegistration.delete({ where: { email } });
    return NextResponse.json({ error: "認証コードの有効期限が切れています。最初からやり直してください。" }, { status: 410 });
  }
  if (pending.otp !== otp) {
    return NextResponse.json({ error: "認証コードが正しくありません。" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { name: pending.name } });
  if (existing) {
    return NextResponse.json({ error: "そのユーザー名は既に使われています。" }, { status: 409 });
  }

  const photo = pending.photo ?? generateAvatarDataUrl(pending.name);
  const user = await prisma.user.create({
    data: { name: pending.name, email: pending.email, passwordHash: pending.passwordHash, photo },
    select: { id: true, name: true, photo: true },
  });

  await prisma.pendingRegistration.delete({ where: { email } });
  return NextResponse.json(user, { status: 201 });
}
