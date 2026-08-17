import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/owner";
import { monthRange, currentMonthValue } from "@/lib/distance";

export const dynamic = "force-dynamic";
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
export async function POST(req: Request) {
  let body: { requesterName?: unknown; month?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 }); }

  const requesterName = typeof body.requesterName === "string" ? body.requesterName : "";
  if (!isOwner(requesterName)) {
    return NextResponse.json({ error: "オーナーのみ実行できます。" }, { status: 403 });
  }
  if (!FAL_KEY) {
    return NextResponse.json({ error: "FAL_KEY が設定されていません。Renderの環境変数を確認してください。" }, { status: 500 });
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
    `Portrait of the same person, champion of the month, ` +
    `dramatic golden cinematic lighting, royal and majestic atmosphere, ` +
    `golden glow around the person, winner's aura, confident expression, ` +
    `epic movie poster style lighting, photorealistic, high quality`;

  let imageUrl: string | undefined;

  // Resolve photo to an HTTP URL that fal.ai can fetch.
  // If stored as base64 data URL, upload to fal.ai storage first.
  let faceUrl: string | null = null;
  if (photo) {
    if (photo.startsWith("http")) {
      faceUrl = photo;
    } else if (photo.startsWith("data:image/")) {
      try {
        const base64Data = photo.replace(/^data:image\/[\w+]+;base64,/, "");
        const contentType = photo.match(/^data:(image\/[\w+]+);/)?.[1] ?? "image/jpeg";
        const ext = contentType.split("/")[1] ?? "jpg";

        // Get a pre-signed upload URL from fal.ai storage
        const initRes = await fetch(
          `https://rest.alpha.fal.ai/storage/upload/initiate?content_type=${encodeURIComponent(contentType)}&extension=${ext}`,
          { headers: { "Authorization": `Key ${FAL_KEY}` } }
        );
        if (initRes.ok) {
          const { upload_url, file_url } = await initRes.json();
          const buf = Buffer.from(base64Data, "base64");
          const putRes = await fetch(upload_url, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: buf,
          });
          if (putRes.ok) {
            faceUrl = file_url;
            console.log("[generate-hero] uploaded base64 photo →", faceUrl);
          }
        }
      } catch (e) {
        console.error("[generate-hero] photo upload failed:", e);
      }
    }
  }

  console.log("[generate-hero] champion:", name, "| faceUrl:", faceUrl ? "✓" : "none (text2img)");

  try {
    if (faceUrl) {
      // PuLID: face-identity-preserving generation using uploaded face photo
      const res = await fetch("https://fal.run/fal-ai/pulid", {
        method: "POST",
        headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: heroPrompt,
          images: [{ image_url: faceUrl }],
          negative_prompt: "blurry, bad quality, distorted face, deformed, different person",
          num_inference_steps: 30,
          guidance_scale: 4.5,
          id_scale: 1.0,
          image_size: "portrait_4_3",
          num_images: 1,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error("[generate-hero] PuLID error:", res.status, text);
        return NextResponse.json({ error: `fal.ai PuLID error ${res.status}: ${text}` }, { status: 500 });
      }
      const data = JSON.parse(text);
      imageUrl = data.images?.[0]?.url;
    } else {
      // text2img fallback — used when no profile photo is available
      const res = await fetch("https://fal.run/fal-ai/flux/dev", {
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
      const text = await res.text();
      if (!res.ok) {
        console.error("[generate-hero] text2img error:", res.status, text);
        return NextResponse.json({ error: `fal.ai text2img error ${res.status}: ${text}` }, { status: 500 });
      }
      const data = JSON.parse(text);
      imageUrl = data.images?.[0]?.url;
    }
  } catch (err) {
    console.error("[generate-hero] fetch error:", err);
    return NextResponse.json({ error: `通信エラー: ${String(err)}` }, { status: 500 });
  }

  if (!imageUrl) {
    return NextResponse.json({ error: "画像URLが取得できませんでした。fal.aiのレスポンス形式を確認してください。" }, { status: 500 });
  }

  const hero = await prisma.monthlyHero.upsert({
    where: { month },
    create: { month, userId: championId, name, laps: totalLaps, imageUrl },
    update: { userId: championId, name, laps: totalLaps, imageUrl },
  });

  return NextResponse.json({ hero });
}
