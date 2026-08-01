"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";
import GenerateButton from "@/components/GenerateButton";
import HistoryPanel from "@/components/HistoryPanel";
import { saveHistoryEntry } from "@/lib/storage";

export default function ResearchPage() {
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const generate = async () => {
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-password": password },
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data.text);
      saveHistoryEntry({ category: "research", subType: "research_weekly", content: data.text });
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.message || "エラーが発生しました");
    }
  };

  return (
    <PasswordGate onVerified={setPassword}>
      <main className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-gray-400">← 戻る</Link>
        </div>
        <h1 className="text-xl font-bold">🔍 ビジネスリサーチ（週次）</h1>
        <div className="text-xs text-gray-400 leading-relaxed">
          Web検索を使って、直近のトレンドから丹羽さんの強み（医療・介護×個人開発）に近い
          ビジネスアイデアを3件だけ厳選提案します。多くても週1回の実行がおすすめです
          （検索を伴うので少し時間がかかります）。
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-4">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</div>}
          <GenerateButton label="🔍 今週のリサーチを実行" onGenerate={generate} />
        </div>

        {result && (
          <div className="rounded-xl bg-white border-2 border-ink p-4">
            <div className="text-xs font-bold text-gray-500 mb-2">リサーチ結果</div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{result}</div>
          </div>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-500 mb-2">📂 過去のリサーチ</h2>
          <HistoryPanel category="research" refreshKey={refreshKey} />
        </section>
      </main>
    </PasswordGate>
  );
}
