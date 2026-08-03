"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import type { SessionUser } from "@/lib/session";

type UserRow = { id: string; name: string; photo: string | null };

export function OwnerUserAdmin({ currentUser }: { currentUser: SessionUser }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) return;
      setUsers(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(u: UserRow) {
    if (!confirm(`「${u.name}」と関連する全ランデータを削除しますか？`)) return;
    setDeletingId(u.id);
    try {
      const res = await fetch(
        `/api/users/${u.id}?requesterName=${encodeURIComponent(currentUser.name)}`,
        { method: "DELETE" }
      );
      if (res.ok || res.status === 204) {
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-red-800">
        <ShieldAlert size={18} />
        ユーザー管理（オーナー専用）
      </h2>
      <p className="mt-1 text-sm text-red-600">
        削除するとそのユーザーの全ランデータも消えます。
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">読み込み中...</p>
      ) : (
        <ul className="mt-4 divide-y divide-red-100">
          {users.map((u) => {
            const isSelf = u.id === currentUser.id;
            return (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <Avatar photo={u.photo} name={u.name} size={36} />
                <span className="flex-1 font-medium text-gray-800">
                  {u.name}
                  {isSelf && (
                    <span className="ml-2 text-xs font-semibold text-brand">
                      (オーナー)
                    </span>
                  )}
                </span>
                {!isSelf && (
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={deletingId === u.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    削除
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
