"use client";

import { useEffect, useState } from "react";
import { Trophy, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { BADGE_MAP } from "@/lib/badges";
import { currentMonthValue } from "@/lib/distance";
import { useSession } from "@/lib/session";
import type { WeatherData } from "@/lib/weather";

type RankEntry = {
  rank: number | null;
  userId: string;
  name: string;
  photo: string | null;
  selectedBadgeId: string | null;
  laps: number;
};

const MILESTONES = [
  { km: 40,   label: "東京〜横浜" },
  { km: 100,  label: "東京〜熱海" },
  { km: 500,  label: "東京〜大阪" },
  { km: 1100, label: "東京〜福岡" },
  { km: 2000, label: "東京〜沖縄" },
];

function analogy(km: number): string {
  const hit = [...MILESTONES].reverse().find((m) => km >= m.km);
  if (!hit) return "";
  const times = Math.floor(km / hit.km);
  return `≈ ${hit.label}を${times === 1 ? "往復" : `${times}往復`}する距離`;
}

const PODIUM_STYLE = [
  { medal: "🥇", ring: "ring-yellow-300 bg-yellow-50", label: "text-yellow-700" },
  { medal: "🥈", ring: "ring-gray-300 bg-gray-50",    label: "text-gray-600"   },
  { medal: "🥉", ring: "ring-orange-300 bg-orange-50", label: "text-orange-600" },
];

export function MonthlySummary() {
  const { user } = useSession();
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const m = currentMonthValue();
    const [y, mo] = m.split("-");
    setMonthLabel(`${parseInt(y)}年${parseInt(mo)}月`);
    Promise.all([
      fetch(`/api/ranking?month=${m}`).then((r) => r.json()),
      fetch("/api/weather").then((r) => r.ok ? r.json() : null),
    ])
      .then(([rankData, weatherData]) => {
        setRanking(rankData.ranking ?? []);
        if (weatherData && !weatherData.error) setWeather(weatherData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ranked = ranking.filter((r) => r.rank !== null && r.laps > 0);
  const top3 = ranked.slice(0, 3);
  const totalLaps = ranking.reduce((s, r) => s + r.laps, 0);
  const totalKm = totalLaps * 5;

  // Personal rank info
  const me = user ? ranking.find((r) => r.userId === user.id) : null;
  const myRank = me?.rank ?? null;
  const myLaps = me?.laps ?? 0;
  const above = myRank && myRank > 1 ? ranked.find((r) => r.rank === myRank - 1) : null;

  let myMessage = "";
  let myColor = "text-sap-text-mid";
  if (user) {
    if (myLaps === 0) {
      myMessage = "今月はまだ走っていません。最初の1周を！";
    } else if (myRank === 1) {
      myMessage = `🥇 現在首位！${myLaps}周 (${myLaps * 5}km)　差を広げよう！`;
      myColor = "text-yellow-700";
    } else if (above) {
      myMessage = `現在${myRank}位 / ${myLaps}周　あと${above.laps - myLaps}周で${above.name}さんを抜ける！`;
      myColor = "text-sap-blue";
    } else {
      myMessage = `現在${myRank !== null ? `${myRank}位` : "圏外"} / ${myLaps}周 (${myLaps * 5}km)`;
    }
  }

  if (loading) {
    return <div className="h-32 rounded-xl border border-sap-border bg-white animate-pulse shadow-sm" />;
  }

  return (
    <div className="rounded-xl border border-sap-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-sap-shell px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <TrendingUp size={15} />
          {monthLabel} サマリー
        </span>
        <div className="flex items-center gap-3">
          {weather && (
            <span className="text-xs text-white/80 flex items-center gap-1.5">
              <span>{weather.emoji}</span>
              <span className="font-semibold">{weather.temp}°C</span>
              <span className="text-white/50">{weather.label}</span>
            </span>
          )}
          <Link href="/ranking" className="text-xs text-white/60 hover:text-white">
            全員を見る →
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Personal rank banner */}
        {user && myMessage && (
          <div className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
            myRank === 1
              ? "border-yellow-200 bg-yellow-50 text-yellow-700"
              : myLaps === 0
              ? "border-gray-200 bg-gray-50 text-gray-500"
              : "border-sap-blue/30 bg-sap-blue-light text-sap-blue"
          }`}>
            <div className="flex items-center gap-2">
              {user && <Avatar photo={user.photo} name={user.name} size={28} />}
              <span className={myColor}>{myMessage}</span>
            </div>
          </div>
        )}

        {/* Ranking + Team stats */}
        <div className="grid grid-cols-2 gap-3">
          {/* Top 3 */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-sap-text-mid">
              <Trophy size={11} className="text-yellow-500" />
              ランキング
            </p>
            {top3.length === 0 ? (
              <p className="text-xs text-sap-text-mid">まだ記録なし</p>
            ) : (
              <ol className="space-y-1.5">
                {top3.map((r, i) => {
                  const s = PODIUM_STYLE[i];
                  const badge = r.selectedBadgeId ? BADGE_MAP[r.selectedBadgeId as keyof typeof BADGE_MAP] : null;
                  return (
                    <li key={r.userId} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1 ${s.ring}`}>
                      <span className="text-base leading-none">{s.medal}</span>
                      <Avatar photo={r.photo} name={r.name} size={22} />
                      <span className="flex-1 truncate text-xs font-semibold text-sap-text-dark">{r.name}</span>
                      {badge && <span className="text-xs">{badge.icon}</span>}
                      <span className={`text-xs font-bold ${s.label}`}>{r.laps}周</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Team stats */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-sap-text-mid">
              <Users size={11} />
              チーム合計
            </p>
            <div className="rounded-lg border border-sap-border bg-gray-50 px-3 py-3">
              <p className="text-xl font-bold text-sap-blue">{totalLaps}周</p>
              <p className="text-sm text-sap-text-mid">{totalKm} km</p>
              {totalKm > 0 && (
                <p className="mt-1 text-xs text-sap-text-mid leading-snug">{analogy(totalKm)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
