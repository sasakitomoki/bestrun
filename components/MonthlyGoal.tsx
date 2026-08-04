"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Check, X, Target } from "lucide-react";
import { currentMonthValue } from "@/lib/distance";
import type { SessionUser } from "@/lib/session";

type GoalData = {
  goal: { id: string; targetLaps: number } | null;
  achievedLaps: number;
};

// Confetti particle rendered as an absolutely-positioned span.
function ConfettiParticle({ index }: { index: number }) {
  const colors = ["#0070F2", "#00AEEF", "#E76500", "#D20A0A", "#2E7D32", "#FFD700"];
  const color = colors[index % colors.length];
  const left = `${(index * 37 + 5) % 95}%`;
  const delay = `${(index * 0.13) % 1.2}s`;
  const size = index % 3 === 0 ? 10 : 7;
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top: "-12px",
        left,
        width: size,
        height: size,
        background: color,
        borderRadius: index % 2 === 0 ? "50%" : "2px",
        animation: `confettiFall 1.4s ease-in forwards`,
        animationDelay: delay,
      }}
    />
  );
}

export function MonthlyGoal({ currentUser }: { currentUser: SessionUser }) {
  const month = currentMonthValue();
  const [data, setData] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const prevAchieved = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/goals?userId=${currentUser.id}&month=${month}`);
      if (!res.ok) return;
      const d: GoalData = await res.json();
      setData(d);
      // Trigger celebration when crossing 100% for the first time this session.
      if (
        d.goal &&
        d.achievedLaps >= d.goal.targetLaps &&
        prevAchieved.current < d.goal.targetLaps
      ) {
        setCelebrated(true);
        setTimeout(() => setCelebrated(false), 3500);
      }
      prevAchieved.current = d.achievedLaps;
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, month]);

  useEffect(() => { load(); }, [load]);

  function startEdit() {
    setInputVal(String(data?.goal?.targetLaps ?? ""));
    setEditing(true);
  }

  async function saveGoal(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(inputVal, 10);
    if (!n || n < 1 || n > 999) return;
    setSaving(true);
    try {
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, month, targetLaps: n }),
      });
      if (res.ok) {
        setEditing(false);
        await load();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const target = data?.goal?.targetLaps ?? 0;
  const achieved = data?.achievedLaps ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const done = target > 0 && achieved >= target;

  // Month label e.g. "2026年8月"
  const [y, m] = month.split("-");
  const monthLabel = `${y}年${parseInt(m)}月`;

  if (loading) return null;

  return (
    <>
      {/* Inject confetti keyframes once */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(160px) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-sap-text-dark">
            <Target size={18} className="text-sap-blue" />
            {monthLabel}の目標
          </h2>
          {data?.goal && !editing && (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-sap-blue"
              title="目標を編集"
            >
              <Pencil size={15} />
            </button>
          )}
        </div>

        {/* No goal set yet */}
        {!data?.goal && !editing && (
          <div className="mt-4">
            <p className="mb-3 text-sm text-gray-500">今月の目標周回数を設定しましょう。</p>
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-sap-blue px-4 py-2 text-sm font-semibold text-white hover:bg-sap-blue-dark"
            >
              <Target size={15} />
              目標を設定する
            </button>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <form onSubmit={saveGoal} className="mt-4 flex items-center gap-2">
            <label className="text-sm text-gray-600">目標周回数</label>
            <input
              type="number"
              min={1}
              max={999}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              autoFocus
              className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-sap-blue focus:outline-none focus:ring-1 focus:ring-sap-blue"
            />
            <span className="text-sm text-gray-500">周</span>
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
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              <X size={14} />キャンセル
            </button>
          </form>
        )}

        {/* Progress display */}
        {data?.goal && !editing && (
          <div className="mt-4 space-y-2">
            <div className="flex items-end justify-between text-sm">
              <span className="text-gray-500">
                <span className="text-2xl font-bold text-sap-text-dark">{achieved}</span>
                <span className="ml-1">/ {target} 周</span>
              </span>
              <span className={`text-lg font-bold ${done ? "text-sap-success" : "text-sap-blue"}`}>
                {pct}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-4 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: done
                    ? "linear-gradient(90deg, #188918, #22c55e)"
                    : "linear-gradient(90deg, #0070F2, #00AEEF)",
                }}
              />
            </div>

            {/* Celebration */}
            {done && (
              <div className="relative mt-3 overflow-hidden rounded-lg bg-green-50 px-4 py-3 text-center">
                {celebrated &&
                  Array.from({ length: 18 }).map((_, i) => (
                    <ConfettiParticle key={i} index={i} />
                  ))}
                <p className="text-base font-bold text-green-700">
                  🎉 目標達成！おめでとうございます！
                </p>
                <p className="mt-0.5 text-sm text-green-600">
                  今月の目標 {target} 周を達成しました！
                </p>
              </div>
            )}

            {!done && pct >= 80 && (
              <p className="text-sm font-medium text-sap-blue">
                🔥 あと {target - achieved} 周で達成！もう少しです！
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
