"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, X } from "lucide-react";
import { useSession } from "@/lib/session";

const STORAGE_KEY = "tbr-approval-toast";

type Stored = { userId: string; seenCount: number };

export function ApprovalToast() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    fetch(`/api/approvals?approverId=${user.id}`)
      .then((r) => r.json())
      .then((data: unknown[]) => {
        const current = Array.isArray(data) ? data.length : 0;
        if (current === 0) return;

        // Check if we've already notified the user for this count.
        let stored: Stored | null = null;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) stored = JSON.parse(raw) as Stored;
        } catch { /* ignore */ }

        const alreadySeen =
          stored?.userId === user.id && stored.seenCount >= current;
        if (alreadySeen) return;

        setCount(current);
        setShow(true);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setVisible(true))
        );

        // Auto-dismiss after 6 seconds.
        timerRef.current = setTimeout(() => dismiss(), 6000);
      })
      .catch(() => {});

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  function dismiss() {
    setVisible(false);
    setTimeout(() => setShow(false), 350);
  }

  function handleClick() {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Mark as seen.
    if (user) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ userId: user.id, seenCount: count } satisfies Stored)
      );
    }
    dismiss();
    router.push("/mypage");
  }

  function handleClose() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (user) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ userId: user.id, seenCount: count } satisfies Stored)
      );
    }
    dismiss();
  }

  if (!show) return null;

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 flex justify-center px-4 pt-3 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-lg">
        <Inbox size={18} className="shrink-0 text-amber-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-800">
            承認待ちの申請が {count} 件あります
          </p>
          <button
            onClick={handleClick}
            className="mt-0.5 text-xs font-semibold text-amber-700 underline hover:text-amber-900"
          >
            マイページで確認する →
          </button>
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 rounded p-1 text-amber-500 hover:bg-amber-100 hover:text-amber-700"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
