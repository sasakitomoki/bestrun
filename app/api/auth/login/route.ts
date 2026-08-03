import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/auth/login -> { name, password }
// Returns user (without passwordHash) on success, 401 on failure.
export async function POST(req: Request) {
  let body: { name?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !password) {
    return NextResponse.json(
      { error: "ユーザー名とパスワードを入力してください。" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { name } });

  // Use a constant-time compare even on "not found" to avoid user enumeration.
  const dummy = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
  const hash = user?.passwordHash ?? dummy;
  const valid = await compare(password, hash);

  if (!user || !valid) {
    return NextResponse.json(
      { error: "ユーザー名またはパスワードが間違っています。" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    photo: user.photo,
  });
}
