"use client";

import Link from "next/link";

const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];

// 曜日ごとのおすすめタスク（小説の設定資料にあったSNS運用設計を踏襲）
function getTodayTasks(day: number, hour: number) {
  // day: 0=日 ... 6=土
  const tasks: { label: string; href: string; note: string }[] = [];

  if (day === 1 || day === 4) {
    // 月・木：医療系の衝撃数字型投稿
    tasks.push({ label: "🩺 医療系Xの投稿を作る", href: "/medical", note: "拡散狙いの「あるある」型が効く曜日です" });
  }
  if (day === 2 || day === 5) {
    // 火・金：精神科ナース実話型
    tasks.push({ label: "🩺 医療系Xの投稿を作る", href: "/medical", note: "専門性で差別化する実話ベースの投稿が向いています" });
  }
  if (day === 3 || day === 6) {
    // 水・土：問いかけ・投票型
    tasks.push({ label: "🩺 Threadsの投稿を作る", href: "/medical", note: "問いかけ・エンゲージメント重視の曜日です" });
  }

  // 子だくさんナースの投稿は毎日。時間帯に応じてカテゴリを提案する
  const charNote =
    hour < 11 ? "朝は「精神科現場の気づき」がおすすめです" :
    hour < 16 ? "昼は「8人育児のリアル」がおすすめです" :
    "夕方以降は「心理学・脳科学の豆知識」がおすすめです";
  tasks.push({ label: "👨‍👩‍👧‍👦 子だくさんナースの投稿を作る", href: "/character", note: charNote });

  // 小説は毎日「続きを書く」候補として出す
  tasks.push({ label: "📖 小説の続きを書く", href: "/novel", note: "少しずつでも積み上げましょう" });

  // 日曜だけリサーチを促す
  if (day === 0) {
    tasks.push({ label: "🔍 今週のビジネスリサーチを見る", href: "/research", note: "週1回のリサーチタイミングです" });
  }

  return tasks;
}

export default function HomePage() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const tasks = getTodayTasks(day, hour);
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日（${WEEKDAY_JP[day]}）`;

  return (
    <main className="space-y-6">
      <header className="text-center pt-4 pb-2">
        <div className="text-xs text-gray-400 mono">HISYO DASHBOARD</div>
        <h1 className="text-2xl font-bold mt-1">秘書</h1>
        <div className="text-sm text-gray-500 mt-1">{dateStr}</div>
      </header>

      <section>
        <h2 className="text-sm font-bold text-gray-500 mb-2">📌 今日やること</h2>
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <Link
              key={i}
              href={t.href}
              className="block rounded-xl border border-gray-200 bg-white p-4 active:scale-[0.98] transition"
            >
              <div className="font-bold text-ink">{t.label}</div>
              <div className="text-xs text-gray-400 mt-1">{t.note}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 pt-2">
        <Link href="/medical" className="rounded-xl bg-white border border-gray-200 py-4 text-center">
          <div className="text-2xl mb-1">🩺</div>
          <div className="text-xs font-bold">医療系営業</div>
        </Link>
        <Link href="/character" className="rounded-xl bg-white border border-gray-200 py-4 text-center">
          <div className="text-2xl mb-1">👨‍👩‍👧‍👦</div>
          <div className="text-xs font-bold">子だくさんナース</div>
        </Link>
        <Link href="/novel" className="rounded-xl bg-white border border-gray-200 py-4 text-center">
          <div className="text-2xl mb-1">📖</div>
          <div className="text-xs font-bold">小説</div>
        </Link>
        <Link href="/research" className="rounded-xl bg-white border border-gray-200 py-4 text-center">
          <div className="text-2xl mb-1">🔍</div>
          <div className="text-xs font-bold">リサーチ</div>
        </Link>
      </section>
    </main>
  );
}
