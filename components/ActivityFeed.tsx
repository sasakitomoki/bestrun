"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ClickableAvatar } from "@/components/ClickableAvatar";

type ActivityItem = {
  id: string;
  laps: number;
  date: string;
  createdAt: string;
  runner: { id: string; name: string; photo: string | null };
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
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity?limit=5")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="rounded-xl border border-sap-border bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sap-text-mid mb-3">
        <Activity size={13} />
        直近の走破
      </h2>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <ClickableAvatar userId={item.runner.id} photo={item.runner.photo} name={item.runner.name} size={32} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-sap-text-dark">{item.runner.name}</span>
              <span className="text-sm text-sap-text-mid">さんが</span>
              <span className="text-sm font-bold text-sap-blue"> {item.laps}周 </span>
              <span className="text-sm text-sap-text-mid">走破しました</span>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
