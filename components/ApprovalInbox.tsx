"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, Check, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { formatDistance } from "@/lib/distance";
import { BADGE_MAP } from "@/lib/badges";
import type { SessionUser } from "@/lib/session";

const NEW_BADGES_KEY = "tbr-new-badges";

type PendingRun = {
  id: string;
  date: string;
  laps: number;
  runner: { id: string; name: string; photo: string | null };
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

export function ApprovalInbox({
  currentUser,
  onChange,
}: {
  currentUser: SessionUser;
  onChange?: () => void;
}) {
  const [items, setItems] = useState<PendingRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/approvals?approverId=${currentUser.id}`);
      if (!res.ok) return;
      setItems(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(runId: string, action: "APPROVE" | "REJECT") {
    setBusyId(runId);
    try {
      const res = await fetch("/api/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, approverId: currentUser.id, action }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.filter((r) => r.id !== runId));
        // Store newly awarded badges in sessionStorage for toast display.
        if (action === "APPROVE" && data.newBadges?.length > 0) {
          const existing = JSON.parse(sessionStorage.getItem(NEW_BADGES_KEY) ?? "[]");
          sessionStorage.setItem(
            NEW_BADGES_KEY,
            JSON.stringify([...existing, ...data.newBadges])
          );
        }
        onChange?.();
      }
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-brand-dark">
        <Inbox size={18} />
        承認待ちの申請
        {items.length > 0 && (
          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-sm font-bold text-white">
            {items.length}
          </span>
        )}
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">読み込み中...</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          あなた宛ての未承認の申請はありません。
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((run) => (
            <li
              key={run.id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <Avatar photo={run.runner.photo} name={run.runner.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">
                  {run.runner.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(run.date)} ・ {formatDistance(run.laps)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => act(run.id, "APPROVE")}
                  disabled={busyId === run.id}
                  title="承認"
                  className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  <Check size={16} />
                  承認
                </button>
                <button
                  onClick={() => act(run.id, "REJECT")}
                  disabled={busyId === run.id}
                  title="否認"
                  className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <X size={16} />
                  否認
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
