"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { EditProfile } from "@/components/EditProfile";
import { StatusEditor } from "@/components/StatusEditor";
import { MonthlyGoal } from "@/components/MonthlyGoal";
import { BadgeCollection } from "@/components/BadgeCollection";
import { RunForm } from "@/components/RunForm";
import { ApprovalInbox } from "@/components/ApprovalInbox";
import { MyRuns } from "@/components/MyRuns";
import { OwnerUserAdmin } from "@/components/OwnerUserAdmin";
import { useSession } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import { currentMonthValue } from "@/lib/distance";

export default function MyPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [myLaps, setMyLaps] = useState<number | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const bump = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // 今月の自分の実績・順位を取得
  useEffect(() => {
    if (!user) return;
    fetch(`/api/ranking?month=${currentMonthValue()}`)
      .then((r) => r.json())
      .then((d) => {
        const me = (d.ranking ?? []).find((r: { userId: string }) => r.userId === user.id);
        setMyLaps(me?.laps ?? 0);
        setMyRank(me?.rank ?? null);
      })
      .catch(() => {});
  }, [user, refreshKey]);

  if (loading || !user) {
    return <p className="py-10 text-center text-gray-500">読み込み中...</p>;
  }

  return (
    <div className="space-y-5">

      {/* ① プロフィールカード */}
      <div className="rounded-xl border border-sap-border bg-white shadow-sm overflow-hidden">
        <div className="bg-sap-shell px-5 py-4">
          <div className="flex items-center gap-4">
            <Avatar photo={user.photo} name={user.name} size={56} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60">マイページ</p>
              <h1 className="text-xl font-bold text-white truncate">{user.name}</h1>
            </div>
            {/* 今月の実績サマリー */}
            <div className="shrink-0 text-right">
              {myLaps !== null && (
                <>
                  <p className="text-2xl font-bold text-white">{myLaps}周</p>
                  <p className="text-xs text-white/60">
                    {myRank !== null ? `今月 ${myRank}位` : "今月 圏外"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="px-5 pb-4">
          <StatusEditor currentUser={user} />
          <EditProfile currentUser={user} />
        </div>
      </div>

      {/* ② 承認待ち（最優先・緊急タスク） */}
      <ApprovalInbox currentUser={user} onChange={bump} />

      {/* ③ 月間目標 ＋ 走破申請（PCで横並び） */}
      <div className="grid gap-5 lg:grid-cols-2">
        <MonthlyGoal currentUser={user} />
        <RunForm currentUser={user} onSubmitted={bump} />
      </div>

      {/* ④ 申請履歴（折りたたみ） */}
      <MyRuns currentUser={user} refreshKey={refreshKey} onChange={bump} />

      {/* ⑤ バッジコレクション（折りたたみ） */}
      <BadgeCollection currentUser={user} refreshKey={refreshKey} />

      {/* ⑥ オーナー専用：ユーザー管理 */}
      {isOwner(user.name) && <OwnerUserAdmin currentUser={user} />}
    </div>
  );
}
