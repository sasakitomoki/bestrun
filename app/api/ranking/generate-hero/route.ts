import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/owner";
import { monthRange, currentMonthValue } from "@/lib/distance";

export const dynamic = "force-dynamic";
// fal.ai generation can take up to 60s
export const maxDuration = 60;

const FAL_KEY = process.env.FAL_KEY ?? "";

// GET /api/ranking/generate-hero?month=YYYY-MM
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? "";
  if (!month) return NextResponse.json({ hero: null });

  try {
    const hero = await prisma.monthlyHero.findUnique({ where: { month } });
    return NextResponse.json({ hero });
  } catch {
    return NextResponse.json({ hero: null });
  }
}

// POST /api/ranking/generate-hero  body: { requesterName, month? }
// Generates an AI hero image for the #1 user of the given month and saves it.
export async function POST(req: Request) {
  let body: { requesterName?: unknown; month?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 }); }

  const requesterName = typeof body.requesterName === "string" ? body.requesterName : "";
  if (!isOwner(requesterName)) {
    return NextResponse.json({ error: "オーナーのみ実行できます。" }, { status: 403 });
  }
  if (!FAL_KEY) {
    return NextResponse.json({ error: "FAL_KEY が設定されていません。" }, { status: 500 });
  }

  const month = typeof body.month === "string" ? body.month : currentMonthValue();
  const range = monthRange(month);
  if (!range) return NextResponse.json({ error: "月の形式が不正です。" }, { status: 400 });

  // Aggregate laps per user for the month
  const runs = await prisma.run.findMany({
    where: { status: "APPROVED", date: { gte: range.start, lt: range.end } },
    select: { runnerId: true, laps: true, runner: { select: { id: true, name: true, photo: true } } },
  });
  if (runs.length === 0) {
    return NextResponse.json({ error: "対象月に承認済みのランがありません。" }, { status: 404 });
  }

  const lapMap = new Map<string, { name: string; photo: string | null; totalLaps: number }>();
  for (const run of runs) {
    const prev = lapMap.get(run.runnerId);
    lapMap.set(run.runnerId, {
      name: run.runner.name,
      photo: run.runner.photo,
      totalLaps: (prev?.totalLaps ?? 0) + run.laps,
    });
  }
  const [[championId, champion]] = [...lapMap.entries()].sort((a, b) => b[1].totalLaps - a[1].totalLaps);
  const { name, photo, totalLaps } = champion;

  const heroPrompt =
    `Epic award ceremony portrait. The monthly champion runner at the Imperial Palace Tokyo. ` +
    `Golden trophy, dramatic cinematic lighting, blue and gold color theme, confetti falling, ` +
    `stadium spotlights, heroic pose, shallow depth of field, 8K photorealistic, ` +
    `professional sports photography, award ceremony atmosphere`;

  let imageUrl: string | undefined;

  try {
    // Upload base64 photo to fal.ai storage so it can be used as img2img reference
    let imageInputUrl: string | null = null;
    if (photo) {
      if (photo.startsWith("http")) {
        imageInputUrl = photo;
      } else if (photo.startsWith("data:image/")) {
        // Upload base64 photo to fal.ai storage
        const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
        const contentType = photo.match(/^data:(image\/\w+);/)?.[1] ?? "image/jpeg";
        const uploadRes = await fetch("https://rest.alpha.fal.ai/storage/upload/base64", {
          method: "POST",
          headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ content_type: contentType, data: base64Data }),
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageInputUrl = uploadData.url ?? null;
        }
      }
    }

    if (imageInputUrl) {
      // img2img: style-transfer the user's photo into a champion portrait
      const res = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
        method: "POST",
        headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageInputUrl,
          prompt: heroPrompt,
          strength: 0.78,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: false,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      imageUrl = data.images?.[0]?.url;
    } else {
      // text2img fallback when no photo available
      const res = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
        method: "POST",
        headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: heroPrompt,
          image_size: "portrait_4_3",
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      imageUrl = data.images?.[0]?.url;
    }
  } catch (err) {
    console.error("[generate-hero] fal.ai error:", err);
    return NextResponse.json({ error: "画像生成に失敗しました。" }, { status: 500 });
  }

  if (!imageUrl) {
    return NextResponse.json({ error: "画像URLが取得できませんでした。" }, { status: 500 });
  }

  const hero = await prisma.monthlyHero.upsert({
    where: { month },
    create: { month, userId: championId, name, laps: totalLaps, imageUrl },
    update: { userId: championId, name, laps: totalLaps, imageUrl },
  });

  return NextResponse.json({ hero });
}
