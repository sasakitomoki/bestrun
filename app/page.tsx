import Link from "next/link";
import { Trophy, UserCircle } from "lucide-react";
import { SapLogo } from "@/components/SapLogo";
import { WeatherCard } from "@/components/WeatherCard";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero — SAP Blue gradient */}
      <section className="rounded-xl bg-gradient-to-br from-sap-blue to-sap-blue-dark px-6 py-14 text-center text-white shadow-lg">
        <div className="mx-auto mb-5 flex justify-center">
          <SapLogo size={60} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">The Best Runners</h1>
        <p className="mt-3 text-white/80 text-sm">
          走った周回数を登録して仲間に承認してもらい、月間ランキングで競い合おう。
        </p>
        <p className="mt-1 text-xs text-white/50">1周 = 約5km（皇居）</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/ranking"
            className="inline-flex items-center gap-2 rounded bg-white px-5 py-2.5 text-sm font-semibold text-sap-blue shadow hover:bg-sap-blue-light"
          >
            <Trophy size={16} />
            ランキングを見る
          </Link>
          <Link
            href="/mypage"
            className="inline-flex items-center gap-2 rounded border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
          >
            <UserCircle size={16} />
            マイページ
          </Link>
        </div>
      </section>

      {/* Weather */}
      <WeatherCard />

      {/* How it works — SAP card style */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            step: "01",
            title: "まず登録",
            body: "ユーザー名とパスワードだけで1分で完了。顔写真も設定してみよう！",
          },
          {
            step: "02",
            title: "走って申請",
            body: "皇居を走ったら日付・周回数を入力して申請。承認者を仲間から選ぼう。",
          },
          {
            step: "03",
            title: "仲間が承認",
            body: "指定された承認者がマイページで確認して承認。承認されたら正式記録に！",
          },
          {
            step: "04",
            title: "ランキングに載る",
            body: "承認済みの周回数が月間ランキングに集計。今月の頂点を目指せ！",
          },
          {
            step: "05",
            title: "目標を立てる",
            body: "今月の目標周回数を設定してプログレスバーで達成率を確認。100%達成でお祝い演出あり🎉",
          },
          {
            step: "06",
            title: "バッジを集める",
            body: "累計周回数や気温条件でバッジ獲得。猛暑日に走れば🔥、50周超えれば🏆が待っている！",
          },
        ].map((s) => (
          <div
            key={s.step}
            className="rounded-lg border border-sap-border bg-white p-5 shadow-sm"
          >
            <span className="text-xs font-bold tracking-widest text-sap-blue">STEP {s.step}</span>
            <h2 className="mt-1 text-base font-bold text-sap-text-dark">{s.title}</h2>
            <p className="mt-2 text-sm text-sap-text-mid">{s.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
