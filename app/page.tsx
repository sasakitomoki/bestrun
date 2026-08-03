import Link from "next/link";
import { Trophy, UserCircle, Footprints } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-6 py-12 text-center text-white shadow">
        <Footprints className="mx-auto mb-4" size={48} />
        <h1 className="text-3xl font-bold">皇居ラン ランキング</h1>
        <p className="mt-3 text-brand-light/90">
          走った周回数を登録して仲間に承認してもらい、月間ランキングで競い合おう。
        </p>
        <p className="mt-1 text-sm text-white/70">1周 = 約5km</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/ranking"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-semibold text-brand-dark shadow hover:bg-gray-100"
          >
            <Trophy size={18} />
            ランキングを見る
          </Link>
          <Link
            href="/mypage"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-dark/40 px-5 py-2.5 font-semibold text-white ring-1 ring-white/40 hover:bg-brand-dark/60"
          >
            <UserCircle size={18} />
            マイページ
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "① 登録", body: "走った日付・周回数を入力し、承認者を選んで申請します。" },
          { title: "② 承認", body: "指定された承認者が内容を確認して承認・否認します。" },
          { title: "③ ランキング", body: "承認済みの周回数が月間ランキングに集計されます。" },
        ].map((s) => (
          <div
            key={s.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-bold text-brand-dark">{s.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{s.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
