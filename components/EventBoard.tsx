"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Clock, UserCheck, Download } from "lucide-react";
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
  timeLabel: string | null;
  location: string | null;
  description: string | null;
  attendees: Attendee[];
  isAttending: boolean;
};

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;
}

function EventCard({
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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sap-text-dark">{event.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-sap-text-mid">
            <span className="flex items-center gap-1">
              <CalendarDays size={13} />
              {formatEventDate(event.date)}
            </span>
            {event.timeLabel && (
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {event.timeLabel}
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
        </div>

        {/* .ics download */}
        <a
          href={`/api/events/${event.id}/calendar.ics`}
          download
          title="カレンダーに追加"
          className="shrink-0 rounded-lg border border-gray-200 p-2 text-gray-400 hover:border-sap-blue hover:text-sap-blue"
        >
          <Download size={16} />
        </a>
      </div>

      {/* Attendees */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex -space-x-2">
          {event.attendees.slice(0, 5).map((a) => (
            <Avatar key={a.id} photo={a.user.photo} name={a.user.name} size={24} className="ring-1 ring-white" />
          ))}
          {event.attendees.length > 5 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 ring-1 ring-white">
              +{event.attendees.length - 5}
            </span>
          )}
        </div>
        <span className="text-xs text-sap-text-mid">
          {event.attendees.length > 0
            ? `${event.attendees.length}名参加予定`
            : "参加者まだいません"}
        </span>

        {userId && (
          <button
            onClick={handleToggle}
            disabled={busy}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
              event.isAttending
                ? "bg-sap-blue text-white hover:bg-sap-blue-dark"
                : "border border-sap-blue text-sap-blue hover:bg-sap-blue-light"
            }`}
          >
            <UserCheck size={14} />
            {event.isAttending ? "参加中" : "参加する"}
          </button>
        )}
      </div>
    </div>
  );
}

export function EventBoard() {
  const { user } = useSession();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = user
      ? `/api/events?upcoming=true&userId=${user.id}`
      : `/api/events?upcoming=true`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  function handleToggle(eventId: string, attending: boolean) {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        if (attending && user) {
          return {
            ...e,
            isAttending: true,
            attendees: [
              ...e.attendees,
              { id: "tmp", userId: user.id, user: { id: user.id, name: user.name, photo: user.photo } },
            ],
          };
        }
        return {
          ...e,
          isAttending: false,
          attendees: e.attendees.filter((a) => a.userId !== user?.id),
        };
      })
    );
  }

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sap-text-mid">
        <CalendarDays size={15} />
        イベント告知
      </h2>
      {events.map((e) => (
        <EventCard key={e.id} event={e} userId={user?.id ?? null} onToggle={handleToggle} />
      ))}
    </section>
  );
}
