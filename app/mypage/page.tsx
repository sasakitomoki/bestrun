"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { EditProfile } from "@/components/EditProfile";
import { MonthlyGoal } from "@/components/MonthlyGoal";
import { BadgeCollection } from "@/components/BadgeCollection";
import { RunForm } from "@/components/RunForm";
import { ApprovalInbox } from "@/components/ApprovalInbox";
import { MyRuns } from "@/components/MyRuns";
import { OwnerUserAdmin } from "@/components/OwnerUserAdmin";
import { useSession } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import { BADGE_MAP } from "@/lib/badges";
import type { BadgeId } from "@/lib/badges";

const NEW_BADGES_KEY = "tbr-new-badges";

type ToastBadge = { id: BadgeId; visible: boolean };

export default function MyPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<ToastBadge[]>([]);
  const bump = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Check sessionStorage for pending badge toasts on mount and after refresh.
  useEffect(() => {
    const raw = sessionStorage.getItem(NEW_BADGES_KEY);
    if (!raw) return;
    try {
      const ids: BadgeId[] = JSON.parse(raw);
      if (ids.length === 0) return;
      sessionStorage.removeItem(NEW_BADGES_KEY);
      setToasts(ids.map((id) => ({ id, visible: true })));
      // Auto-dismiss each toast after a delay.
      ids.forEach((_, i) => {
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((t, idx) => (idx === i ? { ...t, visible: false } : t))
          );
        }, 3500 + i * 800);
      });
    } catch {
      sessionStorage.removeItem(NEW_BADGES_KEY);
    }
  }, [refreshKey]);

  if (loading || !user) {
    return <p className="py-10 text-center text-gray-500">読み込み中...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Badge toast notifications */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t, i) => {
          const badge = BADGE_MAP[t.id];
          if (!badge || !t.visible) return null;
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-sap-blue/30 bg-white px-4 py-3 shadow-lg animate-bounce"
              style={{ animationDuration: "0.6s", animationIterationCount: 3 }}
            >
              <span className="text-2xl">{badge.icon}</span>
              <div>
                <p className="text-xs font-semibold text-sap-blue">新バッジ獲得！</p>
                <p className="text-sm font-bold text-sap-text-dark">{badge.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar photo={user.photo} name={user.name} size={64} />
          <div className="flex-1">
            <p className="text-sm text-gray-500">マイページ</p>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          </div>
        </div>
        <EditProfile currentUser={user} />
      </div>

      <BadgeCollection currentUser={user} refreshKey={refreshKey} />
      <MonthlyGoal currentUser={user} />
      <ApprovalInbox currentUser={user} onChange={bump} />
      <RunForm currentUser={user} onSubmitted={bump} />
      <MyRuns currentUser={user} refreshKey={refreshKey} onChange={bump} />
      {isOwner(user.name) && <OwnerUserAdmin currentUser={user} />}
    </div>
  );
}
