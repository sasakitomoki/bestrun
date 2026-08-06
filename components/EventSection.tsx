"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin,
  UserCheck, Download, Plus, Pencil, Trash2, Check, X,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useSession } from "@/lib/session";
import { isOwner } from "@/lib/owner";

// ─── Types ───────────────────────────────────────────────────────────────────
type Attendee = {
  id: string; userId: string;
  user: { id: string; name: string; photo: string | null };
};

type EventData = {
  id: string; title: string; date: string;
  startTime: string | null; endTime: string | null;
  location: string | null; description: string | null;
  attendees: Attendee[]; isAttending: boolean;
};

type FormState = {
  title: string; date: string; startTime: string;
  endTime: string; location: string; description: string;
};

const EMPTY_FORM: FormState = {
  title: "", date: "", startTime: "", endTime: "", location: "", description: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(iso: string, year: number, month: number, day: number): boolean {
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const days = ["日","月","火","水","木","金","土"];
  return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;
}

// ─── EventForm ────────────────────────────────────────────────────────────────
function EventForm({
  initial, onSave, onCancel, saving,
}: {
  initial: FormState;
  onSave: (f: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-3 rounded-xl border border-sap-blue/30 bg-sap-blue-light p-4">
      <h3 className="text-sm font-bold text-sap-text-dark">
        {initial.title ? "イベント編集" : "新規イベント追加"}
      </h3>
      {([
        { label: "タイトル *", key: "title",    type: "text", placeholder: "皇居ラン 本番開始！" },
        { label: "日付 *",     key: "date",     type: "date", placeholder: "" },
        { label: "場所",       key: "location", type: "text", placeholder: "皇居前・和田倉門" },
      ] as const).map((f) => (
        <div key={f.key}>
          <label className="mb-0.5 block text-xs font-medium text-gray-600">{f.label}</label>
          <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-sap-blue focus:outline-none" />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        {(["startTime", "endTime"] as const).map((k) => (
          <div key={k}>
            <label className="mb-0.5 block text-xs font-medium text-gray-600">
              {k === "startTime" ? "開始時刻" : "終了時刻"}
            </label>
            <input type="time" value={form[k]} onChange={set(k)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-sap-blue focus:outline-none" />
          </div>
        ))}
      </div>
      <div>
        <label className="mb-0.5 block text-xs font-medium text-gray-600">説明</label>
        <textarea value={form.description} onChange={set("description")} rows={2}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-sap-blue focus:outline-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} disabled={saving || !form.title.trim() || !form.date}
          className="inline-flex items-center gap-1 rounded-lg bg-sap-blue px-4 py-2 text-sm font-semibold text-white hover:bg-sap-blue-dark disabled:opacity-50">
          <Check size={14} />{saving ? "保存中..." : "保存"}
        </button>
        <button onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <X size={14} />キャンセル
        </button>
      </div>
    </div>
  );
}

// ─── EventPanel ───────────────────────────────────────────────────────────────
function EventPanel({
  events, selectedDay, year, month, userId, ownerName,
  onToggle, onEdit, onDelete,
}: {
  events: EventData[];
  selectedDay: number | null;
  year: number; month: number;
  userId: string | null; ownerName: string | null;
  onToggle: (id: string, attending: boolean) => void;
  onEdit: (e: EventData) => void;
  onDelete: (id: string) => void;
}) {
  const owner = isOwner(ownerName);

  // Determine which events to show.
  let displayEvents: EventData[];
  let label: string;

  if (selectedDay !== null) {
    displayEvents = events.filter((e) => isSameDay(e.date, year, month, selectedDay));
    label = `${month + 1}月${selectedDay}日`;
  } else {
    // Default: upcoming events (today or later), max 3.
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    displayEvents = events
      .filter((e) => new Date(e.date) >= now)
      .slice(0, 3);
    label = "直近のイベント";
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-widest text-sap-text-mid">
        {label}
      </p>

      {displayEvents.length === 0 ? (
        <p className="text-sm text-sap-text-mid py-2">
          {selectedDay !== null ? "この日のイベントはありません。" : "直近のイベントはありません。"}
        </p>
      ) : (
        displayEvents.map((event) => (
          <EventCard key={event.id} event={event} userId={userId}
            owner={owner} ownerName={ownerName}
            onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
        ))
      )}
    </div>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────
function EventCard({
  event, userId, owner, ownerName, onToggle, onEdit, onDelete,
}: {
  event: EventData; userId: string | null; owner: boolean; ownerName: string | null;
  onToggle: (id: string, attending: boolean) => void;
  onEdit: (e: EventData) => void;
  onDelete: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleToggle() {
    if (!userId) return;
    setBusy(true);
    try {
      if (event.isAttending) {
        await fetch(`/api/events/${event.id}/attend?userId=${userId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/events/${event.id}/attend`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      }
      onToggle(event.id, !event.isAttending);
    } catch { /* ignore */ }
    finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!ownerName || !confirm("このイベントを削除しますか？")) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/events/${event.id}?requesterName=${encodeURIComponent(ownerName)}`,
        { method: "DELETE" }
      );
      if (res.ok || res.status === 204) onDelete(event.id);
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  }

  return (
    <div className="rounded-xl border border-sap-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sap-text-dark text-sm">{event.title}</h3>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-sap-text-mid">
            <span className="flex items-center gap-1">
              <CalendarDays size={11} />{formatDateLabel(event.date)}
            </span>
            {event.startTime && (
              <span className="flex items-center gap-1">
                <Clock size={11} />{event.startTime}{event.endTime ? `〜${event.endTime}` : "〜"}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />{event.location}
              </span>
            )}
          </div>
          {event.description && (
            <p className="mt-1.5 text-xs text-gray-600">{event.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {owner && (
            <>
              <button onClick={() => onEdit(event)}
                className="rounded p-1 text-gray-400 hover:text-sap-blue"><Pencil size={13} /></button>
              <button onClick={handleDelete} disabled={deleting}
                className="rounded p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"><Trash2 size={13} /></button>
            </>
          )}
          <a href={`/api/events/${event.id}/calendar.ics`} download
            className="rounded border border-gray-200 p-1 text-gray-400 hover:border-sap-blue hover:text-sap-blue">
            <Download size={13} />
          </a>
        </div>
      </div>

      {/* Attendees + Join button */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {event.attendees.slice(0, 4).map((a) => (
            <Avatar key={a.id} photo={a.user.photo} name={a.user.name} size={20} className="ring-1 ring-white" />
          ))}
          {event.attendees.length > 4 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs ring-1 ring-white">
              +{event.attendees.length - 4}
            </span>
          )}
        </div>
        <span className="text-xs text-sap-text-mid flex-1">
          {event.attendees.length > 0 ? `${event.attendees.length}名参加予定` : "参加者なし"}
        </span>
        {userId && (
          <button onClick={handleToggle} disabled={busy}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${
              event.isAttending
                ? "bg-sap-blue text-white hover:bg-sap-blue-dark"
                : "border border-sap-blue text-sap-blue hover:bg-sap-blue-light"
            }`}>
            <UserCheck size={11} />{event.isAttending ? "参加中" : "参加する"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main: EventSection ───────────────────────────────────────────────────────
export function EventSection() {
  const { user } = useSession();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [saving, setSaving] = useState(false);

  const owner = isOwner(user?.name);

  const load = useCallback(async () => {
    const url = user ? `/api/events?userId=${user.id}` : "/api/events";
    try {
      const data = await fetch(url).then((r) => r.json());
      setEvents(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);

  function eventsForDay(day: number) {
    return events.filter((e) => isSameDay(e.date, year, month, day));
  }

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

  function handleToggle(eventId: string, attending: boolean) {
    setEvents((prev) => prev.map((e) => {
      if (e.id !== eventId) return e;
      if (attending && user) {
        return { ...e, isAttending: true, attendees: [...e.attendees, { id: "tmp", userId: user.id, user: { id: user.id, name: user.name, photo: user.photo } }] };
      }
      return { ...e, isAttending: false, attendees: e.attendees.filter((a) => a.userId !== user?.id) };
    }));
  }

  function handleDelete(eventId: string) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  async function handleSave(form: FormState) {
    if (!user) return;
    setSaving(true);
    try {
      const body = {
        requesterName: user.name,
        title: form.title.trim(),
        date: new Date(form.date).toISOString(),
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      };
      const res = editingEvent
        ? await fetch(`/api/events/${editingEvent.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setAdding(false); setEditingEvent(null); await load(); }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const showForm = adding || editingEvent !== null;
  const formInitial = editingEvent
    ? { title: editingEvent.title, date: editingEvent.date.slice(0, 10), startTime: editingEvent.startTime ?? "", endTime: editingEvent.endTime ?? "", location: editingEvent.location ?? "", description: editingEvent.description ?? "" }
    : { ...EMPTY_FORM, date: todayLocal() };

  const DOW = ["日","月","火","水","木","金","土"];

  return (
    <div className="rounded-xl border border-sap-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-sap-shell px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <CalendarDays size={15} />
          イベント・カレンダー
        </span>
        {owner && !showForm && (
          <button onClick={() => { setAdding(true); setEditingEvent(null); }}
            className="inline-flex items-center gap-1 rounded-lg bg-sap-blue px-2.5 py-1 text-xs font-semibold text-white hover:bg-sap-blue-dark">
            <Plus size={13} />追加
          </button>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="border-b border-gray-100 p-4">
          <EventForm initial={formInitial} onSave={handleSave}
            onCancel={() => { setAdding(false); setEditingEvent(null); }} saving={saving} />
        </div>
      )}

      {/* Calendar + Event panel side by side */}
      <div className="flex flex-col sm:flex-row">

        {/* Calendar */}
        <div className="sm:w-[280px] shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100">
          {/* Month nav */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <button onClick={prevMonth} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-sap-text-dark">{year}年{month + 1}月</span>
            <button onClick={nextMonth} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <ChevronRight size={16} />
            </button>
          </div>
          {/* DOW */}
          <div className="grid grid-cols-7 bg-gray-50">
            {DOW.map((d, i) => (
              <div key={d} className={`py-1 text-center text-xs font-semibold ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"}`}>
                {d}
              </div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="border-b border-r border-gray-50 h-10" />;
              const hasEvent = eventsForDay(day).length > 0;
              const isSelected = day === selectedDay;
              const dow = i % 7;
              return (
                <button key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative flex flex-col items-center justify-center border-b border-r border-gray-100 h-10 transition-colors ${isSelected ? "bg-sap-blue-light" : "hover:bg-gray-50"}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday(day) ? "bg-sap-blue text-white font-bold"
                    : dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-400" : "text-gray-700"
                  }`}>{day}</span>
                  {hasEvent && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-sap-blue" />}
                </button>
              );
            })}
          </div>
          {/* Deselect hint */}
          {selectedDay !== null && (
            <button onClick={() => setSelectedDay(null)}
              className="flex w-full items-center justify-center gap-1 py-2 text-xs text-sap-blue hover:underline border-t border-gray-100">
              <X size={11} />直近のイベントに戻る
            </button>
          )}
        </div>

        {/* Event panel */}
        <div className="flex-1 min-w-0 p-4">
          <EventPanel
            events={events} selectedDay={selectedDay}
            year={year} month={month}
            userId={user?.id ?? null} ownerName={user?.name ?? null}
            onToggle={handleToggle}
            onEdit={(ev) => { setEditingEvent(ev); setAdding(false); }}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
