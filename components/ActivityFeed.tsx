"use client";

import { useEffect, useState } from "react";
import { Activity, ThumbsUp } from "lucide-react";
import { ClickableAvatar } from "@/components/ClickableAvatar";
import { useSession } from "@/lib/session";

type ActivityItem = {
  id: string;
  laps: number;
  date: string;
  createdAt: string;
  runner: { id: string; name: string; photo: string | null };
  reactionCount: number;
  myReaction: boolean;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function ActivityFeed() {
  const { user } = useSession();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = user ? `/api/activity?limit=5&userId=${user.id}` : "/api/activity?limit=5";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function toggleReaction(item: ActivityItem) {
    if (!user) return;
    const isOwn = item.runner.id === user.id;
    if (isOwn) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id !== item.id ? i : {
          ...i,
          myReaction: !i.myReaction,
          reactionCount: i.myReaction ? i.reactionCount - 1 : i.reactionCount + 1,
        }
      )
    );

    try {
      if (item.myReaction) {
        await fetch(`/api/reactions?runId=${item.id}&userId=${user.id}`, { method: "DELETE" });
      } else {
        await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: item.id, userId: user.id }),
        });
      }
    } catch {
      // Revert on error
      setItems((prev) =>
        prev.map((i) =>
          i.id !== item.id ? i : {
            ...i,
            myReaction: item.myReaction,
            reactionCount: item.reactionCount,
          }
        )
      );
    }
  }

  if (loading || items.length === 0) return null;

  return (
    <div className="rounded-xl border border-sap-border bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sap-text-mid mb-3">
        <Activity size={13} />
        直近の走破
      </h2>
      <ul className="divide-y divide-gray-50">
        {items.map((item) => {
          const isOwn = user?.id === item.runner.id;
          return (
            <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <ClickableAvatar
                userId={item.runner.id}
                photo={item.runner.photo}
                name={item.runner.name}
                size={32}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-sap-text-dark">{item.runner.name}</span>
                <span className="text-sm text-sap-text-mid">さんが</span>
                <span className="text-sm font-bold text-sap-blue"> {item.laps}周 </span>
                <span className="text-sm text-sap-text-mid">走破</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
                {user && !isOwn && (
                  <button
                    onClick={() => toggleReaction(item)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      item.myReaction
                        ? "bg-sap-blue text-white"
                        : "border border-gray-200 text-gray-400 hover:border-sap-blue hover:text-sap-blue"
                    }`}
                  >
                    <ThumbsUp size={11} />
                    {item.reactionCount > 0 && <span>{item.reactionCount}</span>}
                  </button>
                )}
                {(isOwn || !user) && item.reactionCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-400">
                    <ThumbsUp size={11} />
                    {item.reactionCount}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
