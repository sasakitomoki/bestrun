import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/session";
import { NavBar } from "@/components/NavBar";
import { MonthlyRankingModal } from "@/components/MonthlyRankingModal";
import { ApprovalToast } from "@/components/ApprovalToast";
import { AuthGuard } from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "The Best Runners",
  description: "SAP 皇居ランの周回数を登録・承認し、月間ランキングを可視化するアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <SessionProvider>
          <NavBar />
          <ApprovalToast />
          <main className="mx-auto w-full max-w-4xl px-4 py-6">
            <AuthGuard>
              <MonthlyRankingModal />
              {children}
            </AuthGuard>
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
