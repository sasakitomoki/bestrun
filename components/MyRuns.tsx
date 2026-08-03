"use client";

import { useCallback, useEffect, useState } from "react";
import { History } from "lucide-react";
import { formatDistance } from "@/lib/distance";
import type { SessionUser } from "@/lib/session";

type MyRun = {
  id: string;
  date: string;
  laps: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approver: { id: string; name: string; photo: string | null };
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

const STATUS_META: Record<
  MyRun["status"],
  { label: string; className: string }
> = {
  PENDING: { label: "承認待ち", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "承認済み", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "否認", className: "bg-gray-200 text-gray-600" },
};

export function MyRuns({
  currentUser,
  refreshKey,
}: {
  currentUser: SessionUser;
  refreshKey: number;
}) {
  const [runs, setRuns] = useState<MyRun[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs?runnerId=${currentUser.id}`);
      if (!res.ok) return;
      setRuns(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-brand-dark">
        <History size={18} />
        自分の申請履歴
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">読み込み中...</p>
      ) : runs.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">まだ申請がありません。</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {runs.map((run) => {
            const meta = STATUS_META[run.status];
            return (
              <li key={run.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800">
                    {formatDate(run.date)} ・ {formatDistance(run.laps)}
                  </p>
                  <p className="text-sm text-gray-500">
                    承認者: {run.approver.name}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                >
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
