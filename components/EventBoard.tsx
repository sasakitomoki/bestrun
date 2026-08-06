"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, MapPin, Clock, UserCheck, Download, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useSession } from "@/lib/session";
import { isOwner } from "@/lib/owner";

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

type FormState = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
};

const EMPTY_FORM: FormState = { title: "", date: "", startTime: "", endTime: "", location: "", description: "" };

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;
}

function EventForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: FormState;
  onSave: (form: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="space-y-3 rounded-xl border border-sap-blue/30 bg-sap-blue-light p-4">
      <h3 className="text-sm font-bold text-sap-text-dark">
        {initial.title ? "イベント編集" : "新規イベント追加"}
      </h3>
      {([
        { label: "タイトル *", key: "title", type: "text", placeholder: "皇居ラン 本番開始！" },
        { label: "日付 *",     key: "date",  type: "date", placeholder: "" },
        { label: "場所",       key: "location", type: "text", placeholder: "皇居前・和田倉門" },
      ] as const).map((f) => (
        <div key={f.key}>
          <label className="mb-0.5 block text-xs font-medium text-gray-600">{f.label}</label>
          <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-sap-blue focus:outline-none" />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-0.5 block text-xs font-medium text-gray-600">開始時刻</label>
          <input type="time" value={form.startTime} onChange={set("startTime")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-sap-blue focus:outline-none" />
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium text-gray-600">終了時刻</label>
          <input type="time" value={form.endTime} onChange={set("endTime")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-sap-blue focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="mb-0.5 block text-xs font-medium text-gray-600">説明</label>
        <textarea value={form.description} onChange={set("description")} rows={2} placeholder="詳細説明（任意）"
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

function EventCard({
  event,
  userId,
  ownerName,
  onToggle,
  onEdit,
  onDelete,
}: {
  event: EventData;
  userId: string | null;
  ownerName: string | null;
  onToggle: (eventId: string, attending: boolean) => void;
  onEdit: (event: EventData) => void;
  onDelete: (eventId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const owner = isOwner(ownerName);

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
          <h3 className="font-bold text-sap-text-dark">{event.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-sap-text-mid">
            <span className="flex items-center gap-1"><CalendarDays size={13} />{formatEventDate(event.date)}</span>
            {event.startTime && (
              <span className="flex items-center gap-1">
                <Clock size={13} />{event.startTime}{event.endTime ? `〜${event.endTime}` : "〜"}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1"><MapPin size={13} />{event.location}</span>
            )}
          </div>
          {event.description && <p className="mt-2 text-sm text-gray-600">{event.description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {owner && (
            <>
              <button onClick={() => onEdit(event)} title="編集"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-sap-blue">
                <Pencil size={15} />
              </button>
              <button onClick={handleDelete} disabled={deleting} title="削除"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                <Trash2 size={15} />
              </button>
            </>
          )}
          <a href={`/api/events/${event.id}/calendar.ics`} download title="カレンダーに追加"
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:border-sap-blue hover:text-sap-blue">
            <Download size={15} />
          </a>
        </div>
      </div>

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
          {event.attendees.length > 0 ? `${event.attendees.length}名参加予定` : "参加者まだいません"}
        </span>
        {userId && (
          <button onClick={handleToggle} disabled={busy}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${
              event.isAttending
                ? "bg-sap-blue text-white hover:bg-sap-blue-dark"
                : "border border-sap-blue text-sap-blue hover:bg-sap-blue-light"
            }`}>
            <UserCheck size={14} />{event.isAttending ? "参加中" : "参加する"}
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
  const [adding, setAdding] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [saving, setSaving] = useState(false);

  const owner = isOwner(user?.name);

  const load = useCallback(async () => {
    const url = user ? `/api/events?upcoming=true&userId=${user.id}` : "/api/events?upcoming=true";
    try {
      const data = await fetch(url).then((r) => r.json());
      setEvents(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

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
      if (res.ok) {
        setAdding(false);
        setEditingEvent(null);
        await load();
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  if (loading) return null;

  const showForm = adding || editingEvent !== null;
  const formInitial = editingEvent
    ? { title: editingEvent.title, date: editingEvent.date.slice(0, 10), startTime: editingEvent.startTime ?? "", endTime: editingEvent.endTime ?? "", location: editingEvent.location ?? "", description: editingEvent.description ?? "" }
    : { ...EMPTY_FORM, date: todayLocal() };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sap-text-mid">
          <CalendarDays size={15} />
          イベント告知
        </h2>
        {owner && !showForm && (
          <button onClick={() => { setAdding(true); setEditingEvent(null); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sap-blue px-3 py-1.5 text-sm font-semibold text-white hover:bg-sap-blue-dark">
            <Plus size={14} />追加
          </button>
        )}
      </div>

      {showForm && (
        <EventForm
          initial={formInitial}
          onSave={handleSave}
          onCancel={() => { setAdding(false); setEditingEvent(null); }}
          saving={saving}
        />
      )}

      {events.length === 0 && !showForm ? (
        <p className="text-sm text-sap-text-mid">直近のイベントはありません。</p>
      ) : (
        events.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            userId={user?.id ?? null}
            ownerName={user?.name ?? null}
            onToggle={handleToggle}
            onEdit={(ev) => { setEditingEvent(ev); setAdding(false); }}
            onDelete={handleDelete}
          />
        ))
      )}
    </section>
  );
}
