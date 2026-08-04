"use client";

import { useCallback, useEffect, useState } from "react";
import { Award } from "lucide-react";
import { BADGES } from "@/lib/badges";
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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/achievements?userId=${currentUser.id}`);
      if (!res.ok) return;
      const data: AchievementRow[] = await res.json();
      setEarned(new Map(data.map((a) => [a.badgeId, a])));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const earnedCount = earned.size;

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

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {BADGES.map((badge) => {
          const achievement = earned.get(badge.id);
          const isEarned = !!achievement;
          return (
            <div
              key={badge.id}
              title={`${badge.name}：${badge.description}${achievement ? `\n獲得日: ${formatDate(achievement.earnedAt)}` : ""}`}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                isEarned
                  ? "border-sap-blue/30 bg-sap-blue-light shadow-sm"
                  : "border-gray-200 bg-gray-50 opacity-40 grayscale"
              }`}
            >
              <span className="text-3xl leading-none" role="img" aria-label={badge.name}>
                {badge.icon}
              </span>
              <span className={`text-xs font-semibold leading-tight ${isEarned ? "text-sap-text-dark" : "text-gray-400"}`}>
                {badge.name}
              </span>
              {isEarned && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sap-blue text-xs text-white">
                  ✓
                </span>
              )}
            </div>
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
