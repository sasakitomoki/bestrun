import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown; photo?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const photo = typeof body.photo === "string" && body.photo.length > 0 ? body.photo : null;

  if (!name) return NextResponse.json({ error: "ユーザー名を入力してください。" }, { status: 400 });
  if (name.length > 30) return NextResponse.json({ error: "ユーザー名は30文字以内で入力してください。" }, { status: 400 });
  if (!email.endsWith("@sap.com")) {
    return NextResponse.json({ error: "メールアドレスは @sap.com のドメインのみ使用できます。" }, { status: 400 });
  }
  if (password.length < 6) return NextResponse.json({ error: "パスワードは6文字以上で入力してください。" }, { status: 400 });

  const [existingName, existingEmail] = await Promise.all([
    prisma.user.findUnique({ where: { name } }),
    prisma.user.findFirst({ where: { email } }),
  ]);
  if (existingName) return NextResponse.json({ error: "そのユーザー名は既に使われています。" }, { status: 409 });
  if (existingEmail) return NextResponse.json({ error: "そのメールアドレスは既に登録されています。" }, { status: 409 });

  const passwordHash = await hash(password, 10);
  const otp = randomInt(0, 1000000).toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.pendingRegistration.upsert({
    where: { email },
    create: { name, email, passwordHash, photo, otp, expiresAt },
    update: { name, passwordHash, photo, otp, expiresAt },
  });

  await sendOtpEmail(email, otp);
  return NextResponse.json({ ok: true });
}
