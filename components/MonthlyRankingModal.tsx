"use client";

import { useEffect, useRef, useState } from "react";
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

type HeroData = {
  name: string;
  laps: number;
  imageUrl: string;
} | null;

const SHOWN_KEY = "tbr-ranking-modal-shown";
const HERO_PHASE_SECS = 5;

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
              position: "absolute", top: 0, left,
              width: size, height: size,
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
  { bg: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500", text: "text-yellow-900", medal: "🥇", scale: "scale-100", shadow: "shadow-yellow-300/50" },
  { bg: "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400",       text: "text-gray-800",   medal: "🥈", scale: "scale-95",  shadow: "shadow-gray-300/50" },
  { bg: "bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800",   text: "text-amber-100", medal: "🥉", scale: "scale-90",  shadow: "shadow-amber-700/50" },
];

// ─── Phase 1: Hero reveal ─────────────────────────────────────────────────────
function HeroReveal({
  hero, monthLabel, visible, onAdvance,
}: {
  hero: HeroData; monthLabel: string; visible: boolean; onAdvance: () => void;
}) {
  const [countdown, setCountdown] = useState(HERO_PHASE_SECS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); onAdvance(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [visible, onAdvance]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 cursor-pointer ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onAdvance}
    >
      <style>{`
        @keyframes heroScale {
          0%   { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes heroGlow {
          0%, 100% { box-shadow: 0 0 40px 8px rgba(255,215,0,0.4); }
          50%       { box-shadow: 0 0 70px 20px rgba(255,215,0,0.7); }
        }
        @keyframes textSlideUp {
          0%   { transform: translateY(24px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Month label */}
      <p
        className={`mb-3 text-sm font-semibold tracking-widest text-yellow-400/80 uppercase transition-all duration-700 delay-100 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {monthLabel} Champion
      </p>

      {/* Hero image */}
      {hero && (
        <div
          style={{
            animation: visible ? "heroScale 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards, heroGlow 2.5s ease-in-out 0.8s infinite" : undefined,
            borderRadius: "1rem",
            overflow: "hidden",
            maxWidth: "min(85vw, 320px)",
            aspectRatio: "3/4",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.imageUrl}
            alt={`${hero.name} champion`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* Name + laps */}
      <div
        style={{ animation: visible ? "textSlideUp 0.6s ease forwards 0.5s" : undefined, opacity: 0 }}
        className="mt-5 text-center"
      >
        <p className="text-3xl font-black text-white tracking-wide">👑 {hero?.name}</p>
        <p className="mt-1 text-lg font-bold text-yellow-400">{hero?.laps}周達成！</p>
      </div>

      {/* Countdown + hint */}
      <p className="mt-6 text-xs text-white/30">
        {countdown > 0 ? `${countdown}秒後にランキングへ　／　タップでスキップ` : ""}
      </p>
    </div>
  );
}

// ─── Main modal ────────────────────────────────────────────────────────────────
export function MonthlyRankingModal() {
  const [phase, setPhase] = useState<"hero" | "ranking">("hero");
  const [show, setShow] = useState(false);
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [hero, setHero] = useState<HeroData>(null);
  const [monthLabel, setMonthLabel] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prev = prevMonthValue();
    const lastShown = localStorage.getItem(SHOWN_KEY);
    if (lastShown === prev.value) return;

    Promise.all([
      fetch(`/api/ranking?month=${prev.value}`).then((r) => r.json()).catch(() => ({})),
      fetch(`/api/ranking/generate-hero?month=${prev.value}`).then((r) => r.json()).catch(() => ({ hero: null })),
    ]).then(([rankData, heroData]) => {
      const ranked = (rankData.ranking ?? []).filter((r: RankEntry) => r.laps > 0);
      if (ranked.length === 0) return;
      setRanking(ranked.slice(0, 5));
      setMonthLabel(prev.label);
      const h = heroData.hero;
      if (h?.imageUrl) {
        setHero({ name: h.name, laps: h.laps, imageUrl: h.imageUrl });
        setPhase("hero");
      } else {
        setPhase("ranking");
      }
      setShow(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      localStorage.setItem(SHOWN_KEY, prev.value);
    });
  }, []);

  function advanceToRanking() {
    setVisible(false);
    setTimeout(() => {
      setPhase("ranking");
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    }, 400);
  }

  function handleClose() {
    setVisible(false);
    setTimeout(() => setShow(false), 350);
  }

  if (!show) return null;

  // Phase 1 — hero reveal
  if (phase === "hero") {
    return <HeroReveal hero={hero} monthLabel={monthLabel} visible={visible} onAdvance={advanceToRanking} />;
  }

  // Phase 2 — ranking modal
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
        <div className="relative mb-6 text-center">
          <div className={`text-5xl transition-all duration-700 delay-100 ${visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}>
            🏆
          </div>
          <h2 className={`mt-2 text-xl font-bold text-white transition-all duration-700 delay-200 ${visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}>
            {monthLabel}ランキング確定！
          </h2>
          <p className="mt-0.5 text-sm text-white/60">先月の結果を振り返ろう 🎉</p>
        </div>

        <ol className="relative space-y-3">
          {ranking.map((r, i) => {
            const style = RANK_STYLES[i] ?? { bg: "bg-gray-700", text: "text-gray-200", medal: `${r.rank}`, scale: "scale-85", shadow: "" };
            const badge = r.selectedBadgeId ? BADGE_MAP[r.selectedBadgeId as keyof typeof BADGE_MAP] : null;
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
                    <span className={`font-bold truncate ${i === 0 ? "text-lg" : "text-sm"} ${style.text}`}>{r.name}</span>
                    {badge && <span className="text-base">{badge.icon}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold ${i === 0 ? "text-xl" : "text-base"} ${style.text}`}>{r.laps}周</p>
                  <p className={`text-xs ${style.text} opacity-70`}>{r.km}km</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div
          className={`relative mt-6 flex flex-col items-center gap-2 transition-all duration-500 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          style={{ transitionDelay: `${300 + ranking.length * 150}ms` }}
        >
          <Link href="/ranking" onClick={handleClose}
            className="w-full rounded-xl bg-sap-blue py-3 text-center font-bold text-white hover:bg-sap-blue-dark">
            今月のランキングを見る →
          </Link>
          <button onClick={handleClose} className="text-sm text-white/50 hover:text-white/80">閉じる</button>
        </div>
      </div>
    </div>
  );
}
