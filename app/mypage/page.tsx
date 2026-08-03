"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { RunForm } from "@/components/RunForm";
import { ApprovalInbox } from "@/components/ApprovalInbox";
import { MyRuns } from "@/components/MyRuns";
import { useSession } from "@/lib/session";

export default function MyPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  // Bumped whenever the user submits a run or acts on an approval, to refresh
  // dependent lists.
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <p className="py-10 text-center text-gray-500">読み込み中...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <Avatar photo={user.photo} name={user.name} size={64} />
        <div>
          <p className="text-sm text-gray-500">マイページ</p>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
        </div>
      </div>

      <ApprovalInbox currentUser={user} onChange={bump} />
      <RunForm currentUser={user} onSubmitted={bump} />
      <MyRuns currentUser={user} refreshKey={refreshKey} />
    </div>
  );
}
