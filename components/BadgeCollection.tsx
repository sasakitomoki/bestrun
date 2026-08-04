"use client";

import { useCallback, useEffect, useState } from "react";
import { Award } from "lucide-react";
import { BADGES, BADGE_MAP } from "@/lib/badges";
import type { SessionUser } from "@/lib/session";

type AchievementRow = { badgeId: string; earnedAt: string };

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function BadgeCollection({
  currentUser,
  refreshKey,
}: {
  currentUser: SessionUser;
  refreshKey: number;
}) {
  const [earned, setEarned] = useState<Map<string, AchievementRow>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [achRes, userRes] = await Promise.all([
        fetch(`/api/achievements?userId=${currentUser.id}`),
        fetch(`/api/users`),
      ]);
      if (achRes.ok) {
        const data: AchievementRow[] = await achRes.json();
        setEarned(new Map(data.map((a) => [a.badgeId, a])));
      }
      if (userRes.ok) {
        const users: { id: string; selectedBadgeId?: string | null }[] = await userRes.json();
        const me = users.find((u) => u.id === currentUser.id);
        setSelected(me?.selectedBadgeId ?? null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function handleSelect(badgeId: string) {
    // Toggle off if already selected.
    const next = selected === badgeId ? null : badgeId;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedBadgeId: next }),
      });
      if (res.ok) setSelected(next);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const earnedCount = earned.size;
  const selectedBadge = selected ? BADGE_MAP[selected as keyof typeof BADGE_MAP] : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-sap-text-dark">
          <Award size={18} className="text-sap-blue" />
          バッジコレクション
        </h2>
        <span className="text-sm text-sap-text-mid">
          {loading ? "…" : `${earnedCount} / ${BADGES.length} 獲得`}
        </span>
      </div>

      {/* Currently selected badge */}
      {selectedBadge && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-sap-blue-light px-3 py-2 text-sm">
          <span className="text-lg">{selectedBadge.icon}</span>
          <span className="font-semibold text-sap-blue">ランキング表示中：{selectedBadge.name}</span>
          <span className="ml-auto text-xs text-sap-text-mid">クリックで変更・解除</span>
        </div>
      )}
      {!selectedBadge && earnedCount > 0 && (
        <p className="mt-3 text-xs text-sap-text-mid">
          獲得済みバッジをクリックするとランキングに表示されます。
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {BADGES.map((badge) => {
          const achievement = earned.get(badge.id);
          const isEarned = !!achievement;
          const isSelected = selected === badge.id;
          return (
            <button
              key={badge.id}
              disabled={!isEarned || saving}
              onClick={() => isEarned && handleSelect(badge.id)}
              title={
                isEarned
                  ? `${badge.name}：${badge.description}\n獲得日: ${formatDate(achievement!.earnedAt)}\n${isSelected ? "クリックで解除" : "クリックでランキングに表示"}`
                  : `${badge.name}：${badge.description}\n（未獲得）`
              }
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                isSelected
                  ? "border-sap-blue bg-sap-blue-light ring-2 ring-sap-blue shadow-sm"
                  : isEarned
                  ? "border-sap-blue/30 bg-sap-blue-light shadow-sm hover:ring-2 hover:ring-sap-blue/50 cursor-pointer"
                  : "border-gray-200 bg-gray-50 opacity-40 grayscale cursor-default"
              }`}
            >
              <span className="text-3xl leading-none" role="img" aria-label={badge.name}>
                {badge.icon}
              </span>
              <span className={`text-xs font-semibold leading-tight ${isEarned ? "text-sap-text-dark" : "text-gray-400"}`}>
                {badge.name}
              </span>
              {isSelected && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sap-blue text-xs text-white">
                  ★
                </span>
              )}
              {isEarned && !isSelected && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sap-blue text-xs text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!loading && earnedCount === 0 && (
        <p className="mt-4 text-center text-sm text-sap-text-mid">
          走って承認されるとバッジが獲得できます！
        </p>
      )}
    </div>
  );
}
