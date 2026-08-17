"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, Cell, LabelList,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Trophy, BarChart2, List, ChevronLeft, ChevronRight, Infinity as InfinityIcon } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { OwnerRunAdmin } from "@/components/OwnerRunAdmin";
import { UserProfileModal } from "@/components/UserProfileModal";
import { recentMonths, currentMonthValue } from "@/lib/distance";
import { useSession } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import { BADGE_MAP } from "@/lib/badges";
import { MOTIVATIONS } from "@/components/StatusEditor";

type RankingEntry = {
  rank: number | null;
  userId: string;
  name: string;
  photo: string | null;
  selectedBadgeId: string | null;
  statusMessage: string | null;
  motivation: string | null;
  laps: number;
  km: number;
  runCount: number;
};

type AllTimeEntry = RankingEntry & { activeMonths: number };

// ─── Bar chart colors ────────────────────────────────────────────────────────
const BAR_COLORS = ["#0070F2", "#5AACFF", "#A8D4FF", "#D0E9FF"];
function barColor(i: number) { return BAR_COLORS[i] ?? "#D0E9FF"; }

// ─── Top-3 card styles ────────────────────────────────────────────────────────
const TOP3_STYLES = [
  {
    wrapper: "bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 p-[2px] rounded-2xl shadow-lg shadow-yellow-200",
    inner:   "bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-5",
    medal:   "🥇",
    rank:    "text-yellow-600",
    laps:    "text-yellow-700",
    avatarSize: 72,
  },
  {
    wrapper: "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-300 p-[2px] rounded-xl shadow-md shadow-gray-200",
    inner:   "bg-gradient-to-br from-gray-50 to-white rounded-xl p-4",
    medal:   "🥈",
    rank:    "text-gray-500",
    laps:    "text-gray-700",
    avatarSize: 52,
  },
  {
    wrapper: "bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 p-[2px] rounded-xl shadow-md shadow-orange-100",
    inner:   "bg-gradient-to-br from-orange-50 to-white rounded-xl p-4",
    medal:   "🥉",
    rank:    "text-amber-700",
    laps:    "text-amber-800",
    avatarSize: 52,
  },
];

// ─── Top3 fancy card ──────────────────────────────────────────────────────────
function Top3Card({
  r, styleIdx, onClick,
}: {
  r: RankingEntry; styleIdx: number; onClick: () => void;
}) {
  const s = TOP3_STYLES[styleIdx];
  const badge = r.selectedBadgeId ? BADGE_MAP[r.selectedBadgeId as keyof typeof BADGE_MAP] : null;
  const motivationObj = MOTIVATIONS.find((m) => m.value === r.motivation);
  const isFirst = styleIdx === 0;

  return (
    <div className={s.wrapper}>
      <div
        className={`${s.inner} cursor-pointer hover:brightness-95 transition-all`}
        onClick={onClick}
      >
        {/* 全順位: 横並びで統一。1位は要素を少し大きく */}
        <div className="flex items-center gap-3">
          {/* アバター＋メダル */}
          <div className="relative shrink-0">
            <Avatar photo={r.photo} name={r.name} size={s.avatarSize} />
            <span className={`absolute -bottom-1 -right-1 leading-none ${isFirst ? "text-2xl" : "text-xl"}`}>
              {s.medal}
            </span>
          </div>

          {/* 名前・バッジ・ステータス */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className={`font-bold text-sap-text-dark truncate ${isFirst ? "text-lg" : "text-base"}`}>
                {r.name}
              </p>
              {badge && <span className="shrink-0 text-base leading-none">{badge.icon}</span>}
            </div>
            {motivationObj && (
              <p className="mt-0.5 text-xs font-semibold text-sap-blue">{motivationObj.label}</p>
            )}
            {r.statusMessage && (
              <p className="mt-0.5 truncate text-xs text-sap-text-mid">💬 {r.statusMessage}</p>
            )}
          </div>

          {/* 周回数 */}
          <div className="shrink-0 text-right">
            <p className={`font-bold ${isFirst ? "text-2xl" : "text-xl"} ${s.laps}`}>{r.laps}周</p>
            <p className="text-xs text-sap-text-mid">{r.km}km</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Normal rank row ──────────────────────────────────────────────────────────
function RankRow({ r, index, onClick }: { r: RankingEntry; index: number; onClick: () => void }) {
  const isZero = r.rank === null;
  const badge = r.selectedBadgeId ? BADGE_MAP[r.selectedBadgeId as keyof typeof BADGE_MAP] : null;
  const motivationObj = MOTIVATIONS.find((m) => m.value === r.motivation);

  return (
    <li
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 shadow-sm transition-colors hover:border-sap-blue/40 hover:bg-sap-blue-light ${
        isZero ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex w-7 shrink-0 justify-center">
        {isZero ? (
          <span className="text-base font-bold text-gray-300">—</span>
        ) : (
          <span className="text-base font-bold text-gray-500">{r.rank}</span>
        )}
      </div>
      <Avatar photo={r.photo} name={r.name} size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-gray-900">{r.name}</p>
          {badge && <span className="text-sm leading-none">{badge.icon}</span>}
        </div>
        {motivationObj && (
          <p className="text-xs font-semibold text-sap-blue">{motivationObj.label}</p>
        )}
        {r.statusMessage && (
          <p className="truncate text-xs text-sap-text-mid">💬 {r.statusMessage}</p>
        )}
        {!motivationObj && !r.statusMessage && (
          <p className="text-xs text-gray-400">
            {isZero ? "今月はまだ走っていません" : `${r.runCount}回のラン`}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        {isZero ? (
          <p className="text-sm font-bold text-gray-300">0周</p>
        ) : (
          <>
            <p className="text-base font-bold text-sap-blue">{r.laps}周</p>
            <p className="text-xs text-gray-400">{r.km}km</p>
          </>
        )}
      </div>
    </li>
  );
}

// ─── Collapsible list section ────────────────────────────────────────────────
const INITIAL_SHOW = 3;

function CollapsibleRankList({
  items, label, onClickItem, renderRow,
}: {
  items: RankingEntry[];
  label: string;
  onClickItem: (userId: string) => void;
  renderRow?: (r: RankingEntry, onClick: () => void) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, INITIAL_SHOW);
  const hidden = items.length - INITIAL_SHOW;

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-sap-text-mid px-1">
        {label}
      </p>
      <ol className="space-y-2">
        {visible.map((r, i) =>
          renderRow ? (
            renderRow(r, () => onClickItem(r.userId))
          ) : (
            <RankRow key={r.userId} r={r} index={i} onClick={() => onClickItem(r.userId)} />
          )
        )}
      </ol>
      {items.length > INITIAL_SHOW && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full rounded-lg border border-gray-200 py-2 text-xs font-semibold text-sap-text-mid hover:bg-gray-50"
        >
          {expanded ? "折りたたむ ▲" : `もっと見る（残り${hidden}件）▼`}
        </button>
      )}
    </div>
  );
}


// ─── AllTime rank row ─────────────────────────────────────────────────────────
function AllTimeRankRow({ r, onClick }: { r: AllTimeEntry; onClick: () => void }) {
  const badge = r.selectedBadgeId ? BADGE_MAP[r.selectedBadgeId as keyof typeof BADGE_MAP] : null;
  const motivationObj = MOTIVATIONS.find((m) => m.value === r.motivation);
  const isZero = r.rank === null;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <li
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 shadow-sm transition-colors hover:border-sap-blue/40 hover:bg-sap-blue-light ${
        isZero ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex w-7 shrink-0 justify-center">
        {isZero ? (
          <span className="text-base font-bold text-gray-300">—</span>
        ) : r.rank! <= 3 ? (
          <span className="text-xl">{medals[r.rank! - 1]}</span>
        ) : (
          <span className="text-base font-bold text-gray-500">{r.rank}</span>
        )}
      </div>
      <Avatar photo={r.photo} name={r.name} size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-gray-900">{r.name}</p>
          {badge && <span className="text-sm leading-none">{badge.icon}</span>}
        </div>
        {motivationObj && (
          <p className="text-xs font-semibold text-sap-blue">{motivationObj.label}</p>
        )}
        {!motivationObj && (
          <p className="text-xs text-gray-400">
            {isZero ? "まだ記録なし" : `${r.runCount}回 / ${r.activeMonths}ヶ月`}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        {isZero ? (
          <p className="text-sm font-bold text-gray-300">0周</p>
        ) : (
          <>
            <p className="text-base font-bold text-sap-blue">{r.laps}周</p>
            <p className="text-xs text-gray-400">{r.km}km</p>
          </>
        )}
      </div>
    </li>
  );
}

export default function RankingPage() {
  const { user } = useSession();
  const months = useMemo(() => recentMonths(12), []);
  const [monthIdx, setMonthIdx] = useState(0);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [allTimeRanking, setAllTimeRanking] = useState<AllTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingKey, setRankingKey] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "chart">("list");
  const [period, setPeriod] = useState<"monthly" | "alltime">("monthly");
  const [heroGenerating, setHeroGenerating] = useState(false);
  const [heroMsg, setHeroMsg] = useState<string | null>(null);

  const month = months[monthIdx]?.value ?? currentMonthValue();
  const monthLabel = months[monthIdx]?.label ?? month;

  // Monthly ranking
  useEffect(() => {
    if (period !== "monthly") return;
    let active = true;
    setLoading(true);
    fetch(`/api/ranking?month=${month}`)
      .then((r) => r.json())
      .then((d) => { if (active) setRanking(d.ranking ?? []); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, rankingKey, period]);

  // All-time ranking
  useEffect(() => {
    if (period !== "alltime") return;
    let active = true;
    setLoading(true);
    fetch("/api/ranking/all")
      .then((r) => r.json())
      .then((d) => { if (active) setAllTimeRanking(d.ranking ?? []); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period, rankingKey]);

  const ranked = ranking.filter((r) => r.rank !== null && r.laps > 0);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const zeroLap = ranking.filter((r) => r.rank === null);
  const chartData = (period === "alltime"
    ? allTimeRanking.filter((r) => r.laps > 0)
    : ranked
  ).map((r) => ({ name: r.name, laps: r.laps, km: r.km }));

  const allTimeRanked = allTimeRanking.filter((r) => r.laps > 0);
  const allTimeZero = allTimeRanking.filter((r) => r.laps === 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-sap-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-sap-shell px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <Trophy size={15} className="text-yellow-400" />
            {period === "monthly" ? "月間ランキング" : "全期間ランキング"}
          </span>
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                view === "list" ? "bg-white text-sap-shell" : "text-white/70 hover:text-white"
              }`}
            >
              <List size={13} />リスト
            </button>
            <button
              onClick={() => setView("chart")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                view === "chart" ? "bg-white text-sap-shell" : "text-white/70 hover:text-white"
              }`}
            >
              <BarChart2 size={13} />グラフ
            </button>
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setPeriod("monthly")}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              period === "monthly"
                ? "border-b-2 border-sap-blue text-sap-blue"
                : "text-gray-500 hover:text-sap-blue"
            }`}
          >
            月別
          </button>
          <button
            onClick={() => setPeriod("alltime")}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-colors ${
              period === "alltime"
                ? "border-b-2 border-sap-blue text-sap-blue"
                : "text-gray-500 hover:text-sap-blue"
            }`}
          >
            <InfinityIcon size={12} />全期間
          </button>
        </div>

        {/* Month navigation — only for monthly */}
        {period === "monthly" && (
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={() => setMonthIdx((i) => Math.min(i + 1, months.length - 1))}
              disabled={monthIdx >= months.length - 1}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-sap-text-dark">{monthLabel}</span>
            <button
              onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))}
              disabled={monthIdx <= 0}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : view === "chart" ? (
        /* ── Graph view ── */
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-500">
            {period === "monthly" ? `${monthLabel} の周回数（承認済み）` : "全期間累計周回数"}
          </h2>
          {chartData.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">データがありません</p>
          ) : (
            <div style={{ width: "100%", height: Math.max(200, chartData.length * 56) }}>
              <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false}
                    tick={{ fontSize: 13, fill: "#374151" }} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    formatter={(v: number, _n, item) => [`${v}周 (${item.payload.km}km)`, "周回数"]} />
                  <Bar dataKey="laps" radius={[0, 6, 6, 0]} barSize={28}>
                    {chartData.map((_, i) => <Cell key={i} fill={barColor(i)} />)}
                    <LabelList dataKey="laps" position="right" formatter={(v: number) => `${v}周`}
                      style={{ fontSize: 12, fill: "#374151", fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : period === "alltime" ? (
        /* ── All-time list ── */
        <div className="space-y-5">
          {allTimeRanked.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
              <p className="text-gray-500">まだ承認済みの記録がありません。</p>
            </div>
          ) : (
            <CollapsibleRankList
              items={allTimeRanked.map((r) => r as RankingEntry)}
              label="全期間累計"
              onClickItem={setSelectedUserId}
              renderRow={(r, onClick) => (
                <AllTimeRankRow
                  key={r.userId}
                  r={allTimeRanked.find((a) => a.userId === r.userId)!}
                  onClick={onClick}
                />
              )}
            />
          )}
          <CollapsibleRankList
            items={allTimeZero.map((r) => r as RankingEntry)}
            label="まだ走っていない"
            onClickItem={setSelectedUserId}
          />
        </div>
      ) : (
        /* ── Monthly list ── */
        <div className="space-y-5">
          {ranking.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
              <p className="text-gray-500">{monthLabel} の承認済み実績はまだありません。</p>
            </div>
          ) : (
            <>
              {top3.length > 0 && (
                <div className="space-y-3">
                  {top3.map((r, i) => (
                    <Top3Card key={r.userId} r={r} styleIdx={i}
                      onClick={() => setSelectedUserId(r.userId)} />
                  ))}
                </div>
              )}
              <CollapsibleRankList
                items={rest}
                label={top3.length > 0 ? "4位以下" : "ランキング"}
                onClickItem={setSelectedUserId}
              />
              <CollapsibleRankList
                items={zeroLap}
                label="今月まだ走っていない"
                onClickItem={setSelectedUserId}
              />
            </>
          )}
        </div>
      )}

      {user && isOwner(user.name) && period === "monthly" && (
        <>
          <div className="rounded-xl border border-sap-border bg-white p-4 shadow-sm space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-sap-text-mid">
              🎨 ヒーロー画像生成
            </p>
            <p className="text-xs text-gray-500">
              {monthLabel}の1位ユーザーのAI画像を生成します。来月のポップアップに表示されます。
            </p>
            {heroMsg && (
              <p className={`text-xs font-semibold ${heroMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
                {heroMsg}
              </p>
            )}
            <button
              onClick={async () => {
                if (!user) return;
                setHeroGenerating(true);
                setHeroMsg(null);
                try {
                  const res = await fetch("/api/ranking/generate-hero", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ requesterName: user.name, month }),
                  });
                  if (res.ok) {
                    setHeroMsg("✅ 画像生成完了！来月のポップアップに表示されます。");
                  } else {
                    const d = await res.json();
                    setHeroMsg(`❌ ${d.error ?? "生成失敗"}`);
                  }
                } catch {
                  setHeroMsg("❌ 通信エラーが発生しました。");
                } finally {
                  setHeroGenerating(false);
                }
              }}
              disabled={heroGenerating}
              className="rounded-lg bg-sap-blue px-4 py-2 text-sm font-bold text-white hover:bg-sap-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {heroGenerating ? "生成中…（30〜60秒）" : "✨ ヒーロー画像を生成"}
            </button>
          </div>
          <OwnerRunAdmin currentUser={user} month={month}
            onChanged={() => setRankingKey((k) => k + 1)} />
        </>
      )}

      {selectedUserId && (
        <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
