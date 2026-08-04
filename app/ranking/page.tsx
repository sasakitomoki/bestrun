"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Trophy, Medal } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { OwnerRunAdmin } from "@/components/OwnerRunAdmin";
import { recentMonths, currentMonthValue } from "@/lib/distance";
import { useSession } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import { BADGE_MAP } from "@/lib/badges";

type RankingEntry = {
  rank: number;
  userId: string;
  name: string;
  photo: string | null;
  selectedBadgeId: string | null;
  laps: number;
  km: number;
  runCount: number;
};

// Ordered palette for the top ranks; remaining bars share the brand green.
const BAR_COLORS = ["#0070F2", "#5AACFF", "#A8D4FF", "#D0E9FF"];
function barColor(index: number): string {
  return BAR_COLORS[index] ?? "#bbf7d0";
}

const RANK_ACCENT = ["text-yellow-500", "text-gray-400", "text-amber-700"];

export default function RankingPage() {
  const { user } = useSession();
  const months = useMemo(() => recentMonths(12), []);
  const [month, setMonth] = useState(currentMonthValue());
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingKey, setRankingKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    async function load() {
      try {
        const res = await fetch(`/api/ranking?month=${month}`);
        if (!res.ok) return;
        const data = await res.json();
        if (active) setRanking(data.ranking ?? []);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [month, rankingKey]);

  const chartData = ranking.map((r) => ({
    name: r.name,
    laps: r.laps,
    km: r.km,
  }));

  const monthLabel =
    months.find((m) => m.value === month)?.label ?? month;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-dark">
          <Trophy size={26} className="text-yellow-500" />
          月間ランキング
        </h1>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
          表示月
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="py-16 text-center text-gray-500">読み込み中...</p>
      ) : ranking.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">
            {monthLabel} の承認済み実績はまだありません。
          </p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-500">
              {monthLabel} の周回数（承認済み）
            </h2>
            <div style={{ width: "100%", height: Math.max(200, chartData.length * 56) }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 48, bottom: 4, left: 8 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 13, fill: "#374151" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    formatter={(value: number, _name, item) => [
                      `${value}周 (${item.payload.km}km)`,
                      "周回数",
                    ]}
                  />
                  <Bar dataKey="laps" radius={[0, 6, 6, 0]} barSize={28}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={barColor(i)} />
                    ))}
                    <LabelList
                      dataKey="laps"
                      position="right"
                      formatter={(v: number) => `${v}周`}
                      style={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rank list */}
          <ol className="space-y-2">
            {ranking.map((r, i) => (
              <li
                key={r.userId}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex w-8 shrink-0 justify-center">
                  {i < 3 ? (
                    <Medal className={RANK_ACCENT[i]} size={24} />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {r.rank}
                    </span>
                  )}
                </div>
                <Avatar photo={r.photo} name={r.name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-bold text-gray-900">{r.name}</p>
                    {r.selectedBadgeId && BADGE_MAP[r.selectedBadgeId as keyof typeof BADGE_MAP] && (
                      <span
                        title={BADGE_MAP[r.selectedBadgeId as keyof typeof BADGE_MAP].name}
                        className="text-lg leading-none"
                      >
                        {BADGE_MAP[r.selectedBadgeId as keyof typeof BADGE_MAP].icon}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{r.runCount}回のラン</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-brand">{r.laps}周</p>
                  <p className="text-sm text-gray-500">{r.km}km</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {user && isOwner(user.name) && (
        <OwnerRunAdmin
          currentUser={user}
          month={month}
          onChanged={() => setRankingKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
