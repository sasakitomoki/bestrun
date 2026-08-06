import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/events/[id]/calendar.ics  → .ics ファイルダウンロード
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません。" }, { status: 404 });
  }

  const now = new Date();
  const stamp = formatIcalDate(now);

  // Use noon JST as the event time if no specific time is known.
  const start = new Date(event.date);
  start.setHours(start.getHours() + 9); // Store as JST offset in UTC
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const description = [
    event.description,
    event.timeLabel ? `時間：${event.timeLabel}` : null,
    event.location  ? `場所：${event.location}`  : null,
  ].filter(Boolean).join("\\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Best Runners//JP",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@thebestrunners`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatIcalDate(start)}`,
    `DTEND:${formatIcalDate(end)}`,
    `SUMMARY:${escapeIcal(event.title)}`,
    event.location ? `LOCATION:${escapeIcal(event.location)}` : null,
    description ? `DESCRIPTION:${description}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${event.id}.ics"`,
    },
  });
}

function formatIcalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcal(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
