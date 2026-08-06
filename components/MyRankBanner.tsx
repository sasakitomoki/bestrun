"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { currentMonthValue } from "@/lib/distance";
import { Avatar } from "@/components/Avatar";
import Link from "next/link";

type RankEntry = {
  rank: number | null;
  userId: string;
  name: string;
  photo: string | null;
  laps: number;
};

export function MyRankBanner() {
  const { user, loading } = useSession();
  const [myEntry, setMyEntry] = useState<RankEntry | null>(null);
  const [nextEntry, setNextEntry] = useState<RankEntry | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/ranking?month=${currentMonthValue()}`)
      .then((r) => r.json())
      .then((d) => {
        const ranking: RankEntry[] = d.ranking ?? [];
        const ranked = ranking.filter((r) => r.rank !== null);
        const me = ranking.find((r) => r.userId === user.id);
        setMyEntry(me ?? null);
        if (me && me.rank && me.rank > 1) {
          const above = ranked.find((r) => r.rank === me.rank! - 1);
          setNextEntry(above ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setFetched(true));
  }, [user]);

  if (loading || !user || !fetched) return null;

  const laps = myEntry?.laps ?? 0;
  const rank = myEntry?.rank ?? null;

  // Message logic
  let message: { text: string; sub: string; color: string };
  if (laps === 0) {
    message = {
      text: "今月はまだ走っていません",
      sub: "最初の1周を記録しよう！",
      color: "text-gray-500",
    };
  } else if (rank === 1) {
    message = {
      text: `🥇 現在首位！${laps}周 (${laps * 5}km)`,
      sub: "追いかけてくる人がいます。差を広げよう！",
      color: "text-yellow-700",
    };
  } else if (nextEntry) {
    const gap = nextEntry.laps - laps;
    message = {
      text: `${rank}位 / ${laps}周 (${laps * 5}km)`,
      sub: `あと${gap}周で${nextEntry.name}さんを抜ける！`,
      color: "text-sap-blue",
    };
  } else {
    message = {
      text: `${rank !== null ? `${rank}位` : "圏外"} / ${laps}周 (${laps * 5}km)`,
      sub: "走って記録を伸ばそう！",
      color: "text-sap-text-mid",
    };
  }

  return (
    <Link href="/mypage" className="block">
      <div className="flex items-center gap-3 rounded-xl border border-sap-border bg-white px-4 py-3 shadow-sm hover:border-sap-blue/40 hover:bg-sap-blue-light transition-colors">
        <Avatar photo={user.photo} name={user.name} size={40} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${message.color}`}>{message.text}</p>
          <p className="text-xs text-sap-text-mid mt-0.5">{message.sub}</p>
        </div>
        <span className="text-xs text-gray-400 shrink-0">今月 →</span>
      </div>
    </Link>
  );
}
