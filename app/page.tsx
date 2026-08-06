"use client";

import Link from "next/link";
import { Trophy, UserCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { SapLogo } from "@/components/SapLogo";
import { WeatherCard } from "@/components/WeatherCard";
import { EventCalendar } from "@/components/EventCalendar";
import { EventBoard } from "@/components/EventBoard";
import { HomeRanking } from "@/components/HomeRanking";

const STEPS = [
  { step: "01", title: "まず登録",       body: "ユーザー名とパスワードだけで1分で完了。顔写真も設定してみよう！" },
  { step: "02", title: "走って申請",     body: "皇居を走ったら日付・周回数を入力して申請。承認者を仲間から選ぼう。" },
  { step: "03", title: "仲間が承認",     body: "指定された承認者がマイページで確認して承認。承認されたら正式記録に！" },
  { step: "04", title: "ランキングに載る", body: "承認済みの周回数が月間ランキングに集計。今月の頂点を目指せ！" },
  { step: "05", title: "目標を立てる",   body: "今月の目標周回数を設定してプログレスバーで達成率を確認。100%達成でお祝い演出あり🎉" },
  { step: "06", title: "バッジを集める", body: "累計周回数や気温条件でバッジ獲得。猛暑日に走れば🔥、50周超えれば🏆が待っている！" },
];

export default function HomePage() {
  const [stepsOpen, setStepsOpen] = useState(false);

  return (
    <div className="space-y-6">

      {/* Hero — compact */}
      <section className="rounded-xl bg-gradient-to-br from-sap-blue to-sap-blue-dark px-6 py-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <SapLogo size={48} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">The Best Runners</h1>
            <p className="mt-0.5 text-sm text-white/70">皇居ランの周回数を登録・承認・競い合おう</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/ranking"
            className="inline-flex items-center gap-1.5 rounded bg-white px-4 py-2 text-sm font-semibold text-sap-blue shadow hover:bg-sap-blue-light">
            <Trophy size={15} />ランキングを見る
          </Link>
          <Link href="/mypage"
            className="inline-flex items-center gap-1.5 rounded border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
            <UserCircle size={15} />マイページ
          </Link>
        </div>
      </section>

      {/* Weather */}
      <WeatherCard />

      {/* Calendar + Ranking — 2 column on PC */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EventCalendar />
        <div className="space-y-6">
          <HomeRanking />
        </div>
      </div>

      {/* Event list */}
      <EventBoard />

      {/* How it works — collapsible */}
      <div className="rounded-xl border border-sap-border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setStepsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-sap-text-dark hover:bg-gray-50"
        >
          <span>使い方ガイド（STEP 01〜06）</span>
          {stepsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {stepsOpen && (
          <div className="grid gap-4 border-t border-gray-100 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="rounded-lg border border-sap-border bg-gray-50 p-4">
                <span className="text-xs font-bold tracking-widest text-sap-blue">STEP {s.step}</span>
                <h2 className="mt-1 text-sm font-bold text-sap-text-dark">{s.title}</h2>
                <p className="mt-1.5 text-xs text-sap-text-mid">{s.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
