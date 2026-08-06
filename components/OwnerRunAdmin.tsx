"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import type { SessionUser } from "@/lib/session";

type RunStatus = "PENDING" | "APPROVED" | "REJECTED";

type RunRow = {
  id: string;
  date: string;
  laps: number;
  status: RunStatus;
  runner: { id: string; name: string; photo: string | null };
  approver: { id: string; name: string; photo: string | null };
};

const STATUS_LABEL: Record<RunStatus, string> = {
  PENDING: "承認待ち",
  APPROVED: "承認済み",
  REJECTED: "否認",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export function OwnerRunAdmin({
  currentUser,
  month,
  onChanged,
}: {
  currentUser: SessionUser;
  month: string;
  onChanged: () => void;
}) {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLaps, setEditLaps] = useState("");
  const [editStatus, setEditStatus] = useState<RunStatus>("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const INITIAL_SHOW = 5;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/runs/admin?month=${month}`);
      if (!res.ok) return;
      setRuns(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  function startEdit(run: RunRow) {
    setEditId(run.id);
    setEditLaps(String(run.laps));
    setEditStatus(run.status);
  }

  async function saveEdit(runId: string) {
    setBusyId(runId);
    try {
      const res = await fetch(`/api/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: currentUser.name,
          laps: Number(editLaps),
          status: editStatus,
        }),
      });
      if (res.ok) {
        const updated: RunRow = await res.json();
        setRuns((prev) => prev.map((r) => (r.id === runId ? updated : r)));
        setEditId(null);
        onChanged();
      }
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(run: RunRow) {
    if (!confirm(`${run.runner.name} の ${formatDate(run.date)} (${run.laps}周) を削除しますか？`)) return;
    setBusyId(run.id);
    try {
      const res = await fetch(
        `/api/runs/${run.id}?requesterName=${encodeURIComponent(currentUser.name)}`,
        { method: "DELETE" }
      );
      if (res.ok || res.status === 204) {
        setRuns((prev) => prev.filter((r) => r.id !== run.id));
        onChanged();
      }
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-red-800">
        <ShieldAlert size={18} />
        ラン管理（オーナー専用）
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">読み込み中...</p>
      ) : runs.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">この月のランはありません。</p>
      ) : (
        <>
        <ul className="mt-4 divide-y divide-red-100">
          {(expanded ? runs : runs.slice(0, INITIAL_SHOW)).map((run) => {
            const isEditing = editId === run.id;
            return (
              <li key={run.id} className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar photo={run.runner.photo} name={run.runner.name} size={32} />
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-medium text-gray-800">{run.runner.name}</span>
                    <span className="mx-1 text-gray-400">·</span>
                    <span className="text-gray-500">{formatDate(run.date)}</span>
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand">{run.laps}周</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        run.status === "APPROVED" ? "bg-green-100 text-green-800"
                        : run.status === "PENDING" ? "bg-amber-100 text-amber-800"
                        : "bg-gray-200 text-gray-600"
                      }`}>
                        {STATUS_LABEL[run.status]}
                      </span>
                      <button
                        onClick={() => startEdit(run)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-700"
                        title="編集"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(run)}
                        disabled={busyId === run.id}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        title="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 pl-10">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editLaps}
                      onChange={(e) => setEditLaps(e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-brand focus:outline-none"
                    />
                    <span className="text-sm text-gray-500">周</span>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as RunStatus)}
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm focus:border-brand focus:outline-none"
                    >
                      {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => saveEdit(run.id)}
                      disabled={busyId === run.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                      <Check size={14} />保存
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      <X size={14} />キャンセル
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {runs.length > INITIAL_SHOW && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
          >
            {expanded ? (
              <><ChevronUp size={14} />折りたたむ</>
            ) : (
              <><ChevronDown size={14} />もっと見る（残り{runs.length - INITIAL_SHOW}件）</>
            )}
          </button>
        )}
        </>
      )}
    </div>
  );
}
