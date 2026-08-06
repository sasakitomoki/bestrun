"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { BADGE_MAP } from "@/lib/badges";
import { currentMonthValue } from "@/lib/distance";

type RankEntry = {
  rank: number;
  userId: string;
  name: string;
  photo: string | null;
  selectedBadgeId: string | null;
  laps: number;
  km: number;
};

const PODIUM = [
  { medal: "🥇", bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700" },
  { medal: "🥈", bg: "bg-gray-50 border-gray-200",   text: "text-gray-600"   },
  { medal: "🥉", bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
];

export function HomeRanking() {
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const m = currentMonthValue();
    const [y, mo] = m.split("-");
    setMonth(`${parseInt(y)}年${parseInt(mo)}月`);
    fetch(`/api/ranking?month=${m}`)
      .then((r) => r.json())
      .then((d) => setRanking((d.ranking ?? []).filter((r: RankEntry) => r.laps > 0).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-sap-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-sap-text-dark">
          <Trophy size={15} className="text-yellow-500" />
          {month} ランキング
        </h2>
        <Link href="/ranking" className="text-xs font-medium text-sap-blue hover:underline">
          全員を見る →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <p className="text-sm text-sap-text-mid text-center py-4">まだ記録がありません</p>
      ) : (
        <ol className="space-y-2">
          {ranking.map((r, i) => {
            const style = PODIUM[i] ?? PODIUM[2];
            const badge = r.selectedBadgeId ? BADGE_MAP[r.selectedBadgeId as keyof typeof BADGE_MAP] : null;
            return (
              <li key={r.userId}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${style.bg}`}>
                <span className="text-xl w-6 text-center">{style.medal}</span>
                <Avatar photo={r.photo} name={r.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-sap-text-dark truncate">{r.name}</span>
                    {badge && <span className="text-sm">{badge.icon}</span>}
                  </div>
                </div>
                <span className={`text-sm font-bold ${style.text}`}>{r.laps}周</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
