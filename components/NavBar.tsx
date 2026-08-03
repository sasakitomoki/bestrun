"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Trophy, UserCircle, LogOut, Footprints } from "lucide-react";
import { useSession } from "@/lib/session";
import { Avatar } from "@/components/Avatar";

export function NavBar() {
  const { user, logout, loading } = useSession();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  // Poll the pending-approval count so the badge stays fresh.
  useEffect(() => {
    if (!user) {
      setPendingCount(0);
      return;
    }
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/approvals?approverId=${user!.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (active) setPendingCount(Array.isArray(data) ? data.length : 0);
      } catch {
        // ignore
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [user, pathname]);

  const linkClass = (href: string) =>
    `inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-brand text-white"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-dark">
          <Footprints size={22} />
          <span>皇居ラン</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/ranking" className={linkClass("/ranking")}>
            <Trophy size={16} />
            <span className="hidden sm:inline">ランキング</span>
          </Link>

          {user ? (
            <>
              <Link href="/mypage" className={`relative ${linkClass("/mypage")}`}>
                <UserCircle size={16} />
                <span className="hidden sm:inline">マイページ</span>
                {pendingCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
              <div className="ml-1 flex items-center gap-2 pl-1">
                <Avatar photo={user.photo} name={user.name} size={28} />
                <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  title="ログアウト"
                  className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            !loading && (
              <Link href="/login" className={linkClass("/login")}>
                <UserCircle size={16} />
                <span>ログイン</span>
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
