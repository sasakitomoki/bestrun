"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin, UserCheck, Download, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useSession } from "@/lib/session";

type Attendee = {
  id: string;
  userId: string;
  user: { id: string; name: string; photo: string | null };
};

type EventData = {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  description: string | null;
  attendees: Attendee[];
  isAttending: boolean;
};

// Returns days in a month grid (with leading/trailing nulls to fill the week).
function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const days = ["日","月","火","水","木","金","土"];
  return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;
}

function isSameDay(iso: string, year: number, month: number, day: number): boolean {
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

// Inline event detail card (shown in the popup).
function EventDetailCard({
  event,
  userId,
  onToggle,
}: {
  event: EventData;
  userId: string | null;
  onToggle: (eventId: string, attending: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    if (!userId) return;
    setBusy(true);
    try {
      if (event.isAttending) {
        await fetch(`/api/events/${event.id}/attend?userId=${userId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/events/${event.id}/attend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      }
      onToggle(event.id, !event.isAttending);
    } catch { /* ignore */ }
    finally { setBusy(false); }
  }

  return (
    <div className="rounded-xl border border-sap-border bg-white p-4 shadow-sm">
      <h3 className="font-bold text-sap-text-dark">{event.title}</h3>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-sap-text-mid">
        <span className="flex items-center gap-1">
          <CalendarDays size={13} />
          {formatDateLabel(event.date)}
        </span>
        {event.startTime && (
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {event.startTime}{event.endTime ? `〜${event.endTime}` : "〜"}
          </span>
        )}
        {event.location && (
          <span className="flex items-center gap-1">
            <MapPin size={13} />
            {event.location}
          </span>
        )}
      </div>
      {event.description && (
        <p className="mt-2 text-sm text-gray-600">{event.description}</p>
      )}

      {/* Attendees */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex -space-x-2">
          {event.attendees.slice(0, 5).map((a) => (
            <Avatar key={a.id} photo={a.user.photo} name={a.user.name} size={22} className="ring-1 ring-white" />
          ))}
          {event.attendees.length > 5 && (
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 ring-1 ring-white">
              +{event.attendees.length - 5}
            </span>
          )}
        </div>
        <span className="text-xs text-sap-text-mid">
          {event.attendees.length > 0 ? `${event.attendees.length}名参加予定` : "参加者まだいません"}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        {userId && (
          <button
            onClick={handleToggle}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${
              event.isAttending
                ? "bg-sap-blue text-white hover:bg-sap-blue-dark"
                : "border border-sap-blue text-sap-blue hover:bg-sap-blue-light"
            }`}
          >
            <UserCheck size={13} />
            {event.isAttending ? "参加中" : "参加する"}
          </button>
        )}
        <a
          href={`/api/events/${event.id}/calendar.ics`}
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:border-sap-blue hover:text-sap-blue"
        >
          <Download size={13} />
          .ics
        </a>
      </div>
    </div>
  );
}

export function EventCalendar() {
  const { user } = useSession();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Load all events (no upcoming filter — we need past months too for navigation).
  useEffect(() => {
    const url = user ? `/api/events?userId=${user.id}` : "/api/events";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);

  function eventsForDay(day: number): EventData[] {
    return events.filter((e) => isSameDay(e.date, year, month, day));
  }

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  function handleToggle(eventId: string, attending: boolean) {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        if (attending && user) {
          return {
            ...e, isAttending: true,
            attendees: [...e.attendees, { id: "tmp", userId: user.id, user: { id: user.id, name: user.name, photo: user.photo } }],
          };
        }
        return { ...e, isAttending: false, attendees: e.attendees.filter((a) => a.userId !== user?.id) };
      })
    );
  }

  const DOW_LABELS = ["日","月","火","水","木","金","土"];

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sap-text-mid">
        <CalendarDays size={15} />
        カレンダー
      </h2>

      <div className="rounded-xl border border-sap-border bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-sap-shell px-4 py-3">
          <button onClick={prevMonth} className="rounded p-1 text-white/60 hover:text-white hover:bg-white/10">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-white">
            {year}年{month + 1}月
          </span>
          <button onClick={nextMonth} className="rounded p-1 text-white/60 hover:text-white hover:bg-white/10">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {DOW_LABELS.map((d, i) => (
            <div
              key={d}
              className={`py-1.5 text-center text-xs font-semibold ${
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="border-b border-r border-gray-50 p-1 h-12" />;
            const dayEvents = eventsForDay(day);
            const hasEvent = dayEvents.length > 0;
            const isSelected = day === selectedDay;
            const dow = i % 7;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative flex flex-col items-center border-b border-r border-gray-100 p-1 h-12 transition-colors ${
                  isSelected ? "bg-sap-blue-light" : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday(day)
                      ? "bg-sap-blue text-white font-bold"
                      : dow === 0 ? "text-red-400"
                      : dow === 6 ? "text-blue-400"
                      : "text-gray-700"
                  }`}
                >
                  {day}
                </span>
                {hasEvent && (
                  <div className="mt-0.5 flex gap-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className="h-1.5 w-1.5 rounded-full bg-sap-blue" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail popup */}
      {selectedDay !== null && (
        <div className="rounded-xl border border-sap-blue/30 bg-sap-blue-light p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-sap-blue">
              {month + 1}月{selectedDay}日のイベント
            </p>
            <button onClick={() => setSelectedDay(null)} className="rounded p-1 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-sap-text-mid">この日のイベントはありません。</p>
          ) : (
            selectedEvents.map((e) => (
              <EventDetailCard key={e.id} event={e} userId={user?.id ?? null} onToggle={handleToggle} />
            ))
          )}
        </div>
      )}
    </section>
  );
}
