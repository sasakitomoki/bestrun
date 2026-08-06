"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import type { SessionUser } from "@/lib/session";

export const MOTIVATIONS: { value: string; icon: string; label: string }[] = [
  { value: "今月本気出す",       icon: "🔥", label: "🔥 今月本気出す" },
  { value: "絶対首位を取る",     icon: "😤", label: "😤 絶対首位を取る" },
  { value: "目標達成に集中",     icon: "🎯", label: "🎯 目標達成に集中" },
  { value: "マイペースでいく",   icon: "😌", label: "😌 マイペースでいく" },
  { value: "体調見ながら",       icon: "🤕", label: "🤕 体調見ながら" },
  { value: "今月から参加！",     icon: "🆕", label: "🆕 今月から参加！" },
];

export function StatusEditor({ currentUser }: { currentUser: SessionUser }) {
  const [editing, setEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [motivation, setMotivation] = useState("");
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<{
    statusMessage: string | null;
    motivation: string | null;
  }>({ statusMessage: null, motivation: null });

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((users: { id: string; statusMessage?: string | null; motivation?: string | null }[]) => {
        const me = users.find((u) => u.id === currentUser.id);
        if (me) {
          setCurrent({
            statusMessage: me.statusMessage ?? null,
            motivation: me.motivation ?? null,
          });
        }
      })
      .catch(() => {});
  }, [currentUser.id]);

  function handleOpen() {
    setStatusMessage(current.statusMessage ?? "");
    setMotivation(current.motivation ?? "");
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusMessage: statusMessage.trim() || null,
          motivation: motivation || null,
        }),
      });
      if (res.ok) {
        setCurrent({
          statusMessage: statusMessage.trim() || null,
          motivation: motivation || null,
        });
        setEditing(false);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const motivationObj = MOTIVATIONS.find((m) => m.value === current.motivation);

  if (!editing) {
    return (
      <div className="mt-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 space-y-0.5">
            {motivationObj && (
              <p className="text-sm font-semibold text-sap-blue">
                {motivationObj.label}
              </p>
            )}
            {current.statusMessage && (
              <p className="text-sm text-sap-text-mid">
                💬 {current.statusMessage}
              </p>
            )}
            {!motivationObj && !current.statusMessage && (
              <p className="text-sm text-gray-400">ステータスを設定しましょう</p>
            )}
          </div>
          <button
            onClick={handleOpen}
            className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-sap-blue"
            title="ステータスを編集"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="mt-3 space-y-3 rounded-xl border border-sap-blue/20 bg-sap-blue-light p-4">
      <h4 className="text-sm font-bold text-sap-text-dark">ステータス編集</h4>

      {/* 今月の意気込み */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">今月の意気込み</label>
        <select
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sap-blue focus:outline-none focus:ring-1 focus:ring-sap-blue"
        >
          <option value="">（設定しない）</option>
          {MOTIVATIONS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* 一言コメント */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          一言コメント（50文字以内）
        </label>
        <input
          type="text"
          value={statusMessage}
          onChange={(e) => setStatusMessage(e.target.value)}
          maxLength={50}
          placeholder="例：今月こそ首位を取る！"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sap-blue focus:outline-none focus:ring-1 focus:ring-sap-blue"
        />
        <p className="mt-0.5 text-right text-xs text-gray-400">{statusMessage.length}/50</p>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-lg bg-sap-blue px-3 py-1.5 text-sm font-semibold text-white hover:bg-sap-blue-dark disabled:opacity-50"
        >
          <Check size={14} />{saving ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          <X size={14} />キャンセル
        </button>
      </div>
    </form>
  );
}
