"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Trophy, UserCircle, LogOut, ClipboardList } from "lucide-react";
import { useSession } from "@/lib/session";
import { Avatar } from "@/components/Avatar";
import { SapLogo } from "@/components/SapLogo";

export function NavBar() {
  const { user, logout, loading } = useSession();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) { setPendingCount(0); return; }
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/approvals?approverId=${user!.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (active) setPendingCount(Array.isArray(data) ? data.length : 0);
      } catch { /* ignore */ }
    }
    load();
    const id = setInterval(load, 15000);
    return () => { active = false; clearInterval(id); };
  }, [user, pathname]);

  const linkClass = (href: string) =>
    `inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-sap-blue text-white"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  return (
    // SAP Fiori Shell Bar: dark navy background
    <header className="bg-sap-shell shadow-md">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <SapLogo size={26} />
          <span className="text-sm font-semibold text-white tracking-wide">
            The Best Runners
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/ranking" className={linkClass("/ranking")}>
            <Trophy size={15} />
            <span className="hidden sm:inline">ランキング</span>
          </Link>
          <Link href="/board" className={linkClass("/board")}>
            <ClipboardList size={15} />
            <span className="hidden sm:inline">掲示板</span>
          </Link>

          {user ? (
            <>
              {/* Avatar + name → /mypage (badge on avatar) */}
              <Link
                href="/mypage"
                className={`relative ml-2 flex items-center gap-2 rounded border-l border-white/20 pl-3 py-1 pr-2 hover:bg-white/10 transition-colors ${
                  pathname === "/mypage" ? "bg-sap-blue" : ""
                }`}
              >
                <span className="relative">
                  <Avatar photo={user.photo} name={user.name} size={26} />
                  {pendingCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-xs font-bold text-white leading-none">
                      {pendingCount}
                    </span>
                  )}
                </span>
                <span className="hidden text-sm text-white/90 sm:inline">{user.name}</span>
              </Link>
              <button
                onClick={logout}
                title="ログアウト"
                className="rounded p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            !loading && (
              <Link href="/login" className={linkClass("/login")}>
                <UserCircle size={15} />
                <span>ログイン</span>
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
