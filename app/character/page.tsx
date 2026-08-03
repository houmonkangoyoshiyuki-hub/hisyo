"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";
import GenerateButton from "@/components/GenerateButton";
import HistoryPanel from "@/components/HistoryPanel";
import { saveHistoryEntry, getRecentBySubType, getFavoritesBySubType } from "@/lib/storage";

const CATEGORIES = [
  { key: "現場", label: "🏥 精神科現場の気づき" },
  { key: "育児", label: "👨‍👩‍👧‍👦 8人育児のリアル" },
  { key: "豆知識", label: "🧠 心理学・脳科学の豆知識" },
  { key: "当事者へ", label: "💌 当事者への寄り添い" },
] as const;

export default function CharacterPage() {
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0].key);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const subType = `character_${category}`;

  const copyResult = () => {
    navigator.clipboard?.writeText(result).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generate = async () => {
    setError("");
    setResult("");
    try {
      const recentPosts = getRecentBySubType(subType, 10);
      const favorites = getFavoritesBySubType(subType, 5);
      const favNote = favorites.length > 0 ? favorites : [];

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-password": password },
        body: JSON.stringify({
          mode: "character",
          category,
          recentPosts: [...recentPosts, ...favNote.map((f) => `（過去に好評だった例）${f}`)],
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data.text);
      saveHistoryEntry({ category: "character", subType, content: data.text });
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
        <h1 className="text-xl font-bold">👨‍👩‍👧‍👦 子だくさんナース Xの投稿</h1>
        <div className="text-xs text-gray-400">8児のパパ精神科ナース、というキャラクターの投稿を作ります。</div>

        <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-4">
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1.5">カテゴリ</div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`py-2 rounded-lg text-xs font-bold ${
                    category === c.key ? "bg-ink text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <GenerateButton label="✨ 生成する" onGenerate={generate} />
        </div>

        {result && (
          <div className="rounded-xl bg-white border-2 border-ink p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-500">生成結果</div>
              <button onClick={copyResult} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-ink text-white">
                {copied ? "✓ コピー済み" : "コピー"}
              </button>
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{result}</div>
            <div className="text-xs text-gray-400 mt-2">{result.length}文字</div>
          </div>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-500 mb-2">📂 履歴</h2>
          <HistoryPanel category="character" refreshKey={refreshKey} />
        </section>
      </main>
    </PasswordGate>
  );
}
