import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateAvatarDataUrl } from "@/lib/avatar";

export const dynamic = "force-dynamic";

// GET /api/users -> list all users (for approver dropdown).
// passwordHash is never included in responses.
export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, photo: true, createdAt: true, statusMessage: true, motivation: true, selectedBadgeId: true },
  });
  return NextResponse.json(users);
}

// POST /api/users -> register a new user { name, password, photo? }.
export async function POST(req: Request) {
  let body: { name?: unknown; password?: unknown; photo?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const photo =
    typeof body.photo === "string" && body.photo.length > 0
      ? body.photo
      : generateAvatarDataUrl(name); // auto-generate when no photo provided

  if (!name) {
    return NextResponse.json(
      { error: "ユーザー名を入力してください。" },
      { status: 400 }
    );
  }
  if (name.length > 30) {
    return NextResponse.json(
      { error: "ユーザー名は30文字以内で入力してください。" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "パスワードは6文字以上で入力してください。" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "そのユーザー名は既に使われています。" },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: { name, photo, passwordHash },
    select: { id: true, name: true, photo: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
