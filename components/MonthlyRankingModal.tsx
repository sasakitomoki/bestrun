"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { BADGE_MAP } from "@/lib/badges";

type RankEntry = {
  rank: number | null;
  userId: string;
  name: string;
  photo: string | null;
  selectedBadgeId: string | null;
  laps: number;
  km: number;
};

// localStorage key: stores the last month the modal was shown (YYYY-MM).
const SHOWN_KEY = "tbr-ranking-modal-shown";

function prevMonthValue(): { value: string; label: string } {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return {
    value: `${y}-${String(m).padStart(2, "0")}`,
    label: `${y}年${m}月`,
  };
}

// Confetti particle
function Confetti() {
  const colors = ["#FFD700", "#0070F2", "#00AEEF", "#FF6B6B", "#51CF66", "#FF8C00"];
  const particles = Array.from({ length: 40 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes confettiDrop {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110%) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particles.map((_, i) => {
        const color = colors[i % colors.length];
        const left = `${(i * 7 + 3) % 96}%`;
        const delay = `${(i * 0.08) % 2}s`;
        const size = i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5;
        const duration = `${1.8 + (i % 5) * 0.2}s`;
        return (
          <span
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left,
              width: size,
              height: size,
              background: color,
              borderRadius: i % 2 === 0 ? "50%" : "2px",
              animation: `confettiDrop ${duration} ease-in forwards`,
              animationDelay: delay,
            }}
          />
        );
      })}
    </div>
  );
}

const RANK_STYLES = [
  {
    bg: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500",
    text: "text-yellow-900",
    medal: "🥇",
    scale: "scale-100",
    shadow: "shadow-yellow-300/50",
  },
  {
    bg: "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400",
    text: "text-gray-800",
    medal: "🥈",
    scale: "scale-95",
    shadow: "shadow-gray-300/50",
  },
  {
    bg: "bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800",
    text: "text-amber-100",
    medal: "🥉",
    scale: "scale-90",
    shadow: "shadow-amber-700/50",
  },
];

export function MonthlyRankingModal() {
  const [show, setShow] = useState(false);
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prev = prevMonthValue();
    const lastShown = localStorage.getItem(SHOWN_KEY);
    if (lastShown === prev.value) return; // Already shown this month.

    // Fetch previous month's ranking.
    fetch(`/api/ranking?month=${prev.value}`)
      .then((r) => r.json())
      .then((data) => {
        const ranked = (data.ranking ?? []).filter((r: RankEntry) => r.laps > 0);
        if (ranked.length === 0) return;
        setRanking(ranked.slice(0, 5));
        setMonthLabel(prev.label);
        setShow(true);
        // Trigger enter animation after mount.
        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
        // Mark as shown.
        localStorage.setItem(SHOWN_KEY, prev.value);
      })
      .catch(() => {});
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(() => setShow(false), 350);
  }

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-sap-shell to-gray-900 p-6 shadow-2xl transition-all duration-500 ${
          visible ? "translate-y-0 scale-100" : "-translate-y-8 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Confetti />

        {/* Header */}
        <div className="relative mb-6 text-center">
          <div
            className={`text-5xl transition-all duration-700 delay-100 ${
              visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
            }`}
          >
            🏆
          </div>
          <h2
            className={`mt-2 text-xl font-bold text-white transition-all duration-700 delay-200 ${
              visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
            }`}
          >
            {monthLabel}ランキング確定！
          </h2>
          <p className="mt-0.5 text-sm text-white/60">先月の結果を振り返ろう 🎉</p>
        </div>

        {/* Ranking list */}
        <ol className="relative space-y-3">
          {ranking.map((r, i) => {
            const style = RANK_STYLES[i] ?? {
              bg: "bg-gray-700",
              text: "text-gray-200",
              medal: `${r.rank}`,
              scale: "scale-85",
              shadow: "",
            };
            const badge = r.selectedBadgeId
              ? BADGE_MAP[r.selectedBadgeId as keyof typeof BADGE_MAP]
              : null;
            return (
              <li
                key={r.userId}
                className={`flex items-center gap-3 rounded-xl p-3 shadow-lg ${style.bg} ${style.shadow} ${style.scale} transition-all duration-500 ${
                  visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                }`}
                style={{ transitionDelay: `${300 + i * 150}ms` }}
              >
                <span className="text-2xl w-8 text-center">{style.medal}</span>
                <Avatar photo={r.photo} name={r.name} size={i === 0 ? 44 : 36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold truncate ${i === 0 ? "text-lg" : "text-sm"} ${style.text}`}>
                      {r.name}
                    </span>
                    {badge && <span className="text-base">{badge.icon}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold ${i === 0 ? "text-xl" : "text-base"} ${style.text}`}>
                    {r.laps}周
                  </p>
                  <p className={`text-xs ${style.text} opacity-70`}>{r.km}km</p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Footer */}
        <div
          className={`relative mt-6 flex flex-col items-center gap-2 transition-all duration-500 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: `${300 + ranking.length * 150}ms` }}
        >
          <Link
            href="/ranking"
            onClick={handleClose}
            className="w-full rounded-xl bg-sap-blue py-3 text-center font-bold text-white hover:bg-sap-blue-dark"
          >
            今月のランキングを見る →
          </Link>
          <button
            onClick={handleClose}
            className="text-sm text-white/50 hover:text-white/80"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
