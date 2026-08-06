import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/events/[id]/calendar.ics
// Generates a proper RFC 5545 .ics file with Asia/Tokyo timezone.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません。" }, { status: 404 });
  }

  // Parse date as JST (YYYY-MM-DD in local time).
  const dateStr = event.date.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const [y, mo, d] = dateStr.split("-").map(Number);

  // Parse HH:MM strings (default: 09:00 start, 10:00 end).
  const [sh, sm] = parseTime(event.startTime ?? "09:00");
  const [eh, em] = parseTime(event.endTime   ?? `${sh + 1}:${String(sm).padStart(2, "0")}`);

  // Format as TZID local datetime: YYYYMMDDTHHMMSS
  const dtStart = `${y}${p(mo)}${p(d)}T${p(sh)}${p(sm)}00`;
  const dtEnd   = `${y}${p(mo)}${p(d)}T${p(eh)}${p(em)}00`;
  const stamp   = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const description = [
    event.description,
    event.startTime ? `開始：${event.startTime}` : null,
    event.endTime   ? `終了：${event.endTime}`   : null,
    event.location  ? `場所：${event.location}`  : null,
  ].filter(Boolean).join("\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Best Runners//JP",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    // Embed minimal VTIMEZONE block so Outlook renders correctly.
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Tokyo",
    "BEGIN:STANDARD",
    "TZNAME:JST",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0900",
    "TZOFFSETTO:+0900",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${event.id}@thebestrunners`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Asia/Tokyo:${dtStart}`,
    `DTEND;TZID=Asia/Tokyo:${dtEnd}`,
    `SUMMARY:${esc(event.title)}`,
    event.location  ? `LOCATION:${esc(event.location)}`   : null,
    description     ? `DESCRIPTION:${description}`         : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const filename = `event-${event.id}.ics`;
  return new NextResponse(lines, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function parseTime(hhmm: string): [number, number] {
  const [h, m] = hhmm.split(":").map(Number);
  return [isNaN(h) ? 9 : h, isNaN(m) ? 0 : m];
}

function p(n: number): string {
  return String(n).padStart(2, "0");
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
