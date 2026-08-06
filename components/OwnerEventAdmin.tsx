"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { SessionUser } from "@/lib/session";

type EventData = {
  id: string;
  title: string;
  date: string;
  timeLabel: string | null;
  location: string | null;
  description: string | null;
};

type FormState = {
  title: string;
  date: string;
  timeLabel: string;
  location: string;
  description: string;
};

const EMPTY_FORM: FormState = { title: "", date: "", timeLabel: "", location: "", description: "" };

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function OwnerEventAdmin({ currentUser }: { currentUser: SessionUser }) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) return;
      setEvents(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startAdd() {
    setForm({ ...EMPTY_FORM, date: todayLocal() });
    setEditId(null);
    setAdding(true);
  }

  function startEdit(e: EventData) {
    setForm({
      title: e.title,
      date: e.date.slice(0, 10),
      timeLabel: e.timeLabel ?? "",
      location: e.location ?? "",
      description: e.description ?? "",
    });
    setEditId(e.id);
    setAdding(false);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const body = {
        requesterName: currentUser.name,
        title: form.title.trim(),
        date: new Date(form.date).toISOString(),
        timeLabel: form.timeLabel.trim() || null,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      };
      const res = editId
        ? await fetch(`/api/events/${editId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (res.ok) {
        setAdding(false);
        setEditId(null);
        setForm(EMPTY_FORM);
        await load();
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("このイベントを削除しますか？")) return;
    setDeletingId(id);
    try {
      const res = await fetch(
        `/api/events/${id}?requesterName=${encodeURIComponent(currentUser.name)}`,
        { method: "DELETE" }
      );
      if (res.ok || res.status === 204) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  const showForm = adding || editId !== null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-red-800">
          <CalendarDays size={18} />
          イベント管理（オーナー専用）
        </h2>
        {!showForm && (
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sap-blue px-3 py-1.5 text-sm font-semibold text-white hover:bg-sap-blue-dark"
          >
            <Plus size={15} />
            追加
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-bold text-sap-text-dark">
            {editId ? "イベント編集" : "新規イベント追加"}
          </h3>
          {[
            { label: "タイトル *", key: "title", type: "text", placeholder: "皇居ラン 本番開始！" },
            { label: "日付 *", key: "date", type: "date", placeholder: "" },
            { label: "時刻", key: "timeLabel", type: "text", placeholder: "朝6:00〜" },
            { label: "場所", key: "location", type: "text", placeholder: "皇居前・和田倉門" },
          ].map((f) => (
            <div key={f.key}>
              <label className="mb-0.5 block text-xs font-medium text-gray-600">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key as keyof FormState]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-sap-blue focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="mb-0.5 block text-xs font-medium text-gray-600">説明</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="詳細説明（任意）"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-sap-blue focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.date}
              className="inline-flex items-center gap-1 rounded-lg bg-sap-blue px-4 py-2 text-sm font-semibold text-white hover:bg-sap-blue-dark disabled:opacity-50"
            >
              <Check size={14} />{saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={() => { setAdding(false); setEditId(null); }}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <X size={14} />キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Event list */}
      {loading ? (
        <p className="mt-4 text-sm text-gray-500">読み込み中...</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">イベントはありません。</p>
      ) : (
        <ul className="mt-4 divide-y divide-red-100">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800">{e.title}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(e.date)}
                  {e.timeLabel && ` ${e.timeLabel}`}
                  {e.location && ` · ${e.location}`}
                </p>
              </div>
              <button
                onClick={() => startEdit(e)}
                className="rounded p-1.5 text-gray-400 hover:text-sap-blue"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(e.id)}
                disabled={deletingId === e.id}
                className="rounded p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
