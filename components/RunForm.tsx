"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { formatDistance } from "@/lib/distance";
import type { SessionUser } from "@/lib/session";

type UserOption = { id: string; name: string; photo: string | null };

// Today as YYYY-MM-DD in local time (for the date input default).
function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RunForm({
  currentUser,
  onSubmitted,
}: {
  currentUser: SessionUser;
  onSubmitted: () => void;
}) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [date, setDate] = useState(todayLocal());
  const [laps, setLaps] = useState("1");
  const [approverId, setApproverId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) return;
        const data: UserOption[] = await res.json();
        setUsers(data.filter((u) => u.id !== currentUser.id));
      } catch {
        // ignore
      }
    }
    load();
  }, [currentUser.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const lapsNum = parseInt(laps, 10);
    if (!approverId) {
      setMessage({ type: "err", text: "承認者を選択してください。" });
      return;
    }
    if (!laps || isNaN(lapsNum) || lapsNum < 1 || lapsNum > 100) {
      setMessage({ type: "err", text: "周回数は1〜100の整数で入力してください。" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runnerId: currentUser.id,
          approverId,
          date,
          laps: lapsNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "申請に失敗しました。");
      setMessage({ type: "ok", text: "申請を送信しました。承認をお待ちください。" });
      setLaps("1");
      setApproverId("");
      onSubmitted();
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "申請に失敗しました。",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold text-brand-dark">
        <Send size={18} />
        走破申請
      </h2>

      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${
            message.type === "ok"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            走った日付
          </label>
          <input
            type="date"
            value={date}
            max={todayLocal()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            周回数
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={laps}
            onChange={(e) => setLaps(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <p className="mt-1 text-sm font-semibold text-brand">
            推定走行距離: {parseInt(laps, 10) >= 1 ? formatDistance(parseInt(laps, 10)) : "—"}
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          承認者（自分以外）
        </label>
        <select
          value={approverId}
          onChange={(e) => setApproverId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="">選択してください</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        {users.length === 0 && (
          <p className="mt-1 text-sm text-amber-600">
            承認者候補がいません。もう一人ユーザーを登録してください。
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {submitting ? "送信中..." : "申請する"}
      </button>
    </form>
  );
}
