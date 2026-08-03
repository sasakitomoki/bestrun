import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/session";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "皇居ラン ランキング",
  description: "皇居ランの周回数を登録・承認し、月間ランキングを可視化するアプリ",
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
          <main className="mx-auto w-full max-w-4xl px-4 py-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
