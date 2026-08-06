"use client";

import { useEffect, useState } from "react";
import { currentMonthValue } from "@/lib/distance";
import { Users } from "lucide-react";

// Distance milestones for the analogy (one-way km).
const MILESTONES = [
  { km: 40,   label: "東京〜横浜" },
  { km: 100,  label: "東京〜熱海" },
  { km: 500,  label: "東京〜大阪" },
  { km: 1100, label: "東京〜福岡" },
  { km: 2000, label: "東京〜沖縄" },
];

function analogy(km: number): string {
  const hit = [...MILESTONES].reverse().find((m) => km >= m.km);
  if (!hit) return `${km}km`;
  const times = Math.floor(km / hit.km);
  return `${hit.label}を${times === 1 ? "往復" : `${times}往復`}する距離！`;
}

export function TeamStats() {
  const [totalLaps, setTotalLaps] = useState<number | null>(null);
  const [month, setMonth] = useState("");

  useEffect(() => {
    const m = currentMonthValue();
    const [y, mo] = m.split("-");
    setMonth(`${parseInt(y)}年${parseInt(mo)}月`);
    fetch(`/api/ranking?month=${m}`)
      .then((r) => r.json())
      .then((d) => {
        const total = (d.ranking ?? []).reduce(
          (sum: number, r: { laps: number }) => sum + r.laps, 0
        );
        setTotalLaps(total);
      })
      .catch(() => {});
  }, []);

  if (totalLaps === null) return null;
  const km = totalLaps * 5;

  return (
    <div className="rounded-xl border border-sap-border bg-white px-4 py-3 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sap-text-mid mb-2">
        <Users size={13} />
        {month} チーム合計
      </p>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-sap-blue">{totalLaps}周</span>
        <span className="text-sm text-sap-text-mid mb-0.5">= {km}km</span>
      </div>
      {km > 0 && (
        <p className="mt-1 text-xs text-sap-text-mid">≈ {analogy(km)}</p>
      )}
    </div>
  );
}
