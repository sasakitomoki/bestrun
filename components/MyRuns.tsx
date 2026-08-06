"use client";

import { useCallback, useEffect, useState } from "react";
import { History, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
  PENDING:  { label: "承認待ち", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "承認済み", className: "bg-sap-blue-light text-sap-blue" },
  REJECTED: { label: "否認",     className: "bg-gray-100 text-gray-500" },
};

export function MyRuns({
  currentUser,
  refreshKey,
  onChange,
}: {
  currentUser: SessionUser;
  refreshKey: number;
  onChange?: () => void;
}) {
  const [runs, setRuns] = useState<MyRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const INITIAL_SHOW = 3;

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

  async function handleDelete(runId: string) {
    if (!confirm("この申請を取り消しますか？")) return;
    setDeletingId(runId);
    try {
      const res = await fetch(
        `/api/runs/${runId}?runnerId=${currentUser.id}`,
        { method: "DELETE" }
      );
      if (res.ok || res.status === 204) {
        setRuns((prev) => prev.filter((r) => r.id !== runId));
        onChange?.();
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-gray-50"
      >
        <h2 className="flex items-center gap-2 text-base font-bold text-sap-text-dark">
          <History size={16} />
          申請履歴
          {runs.length > 0 && (
            <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
              {runs.length}件
            </span>
          )}
        </h2>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-4">
          {loading ? (
            <p className="py-4 text-sm text-gray-500">読み込み中...</p>
          ) : runs.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">まだ申請がありません。</p>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {(expanded ? runs.slice(0, expanded ? runs.length : INITIAL_SHOW) : runs.slice(0, INITIAL_SHOW)).map((run) => {
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
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                      {run.status === "PENDING" && (
                        <button
                          onClick={() => handleDelete(run.id)}
                          disabled={deletingId === run.id}
                          title="申請を取り消す"
                          className="ml-1 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
