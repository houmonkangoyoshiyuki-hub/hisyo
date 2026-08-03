"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";
import GenerateButton from "@/components/GenerateButton";
import HistoryPanel from "@/components/HistoryPanel";
import { saveHistoryEntry, getRecentBySubType } from "@/lib/storage";

const CATEGORIES = [
  { key: "現場", label: "🏥 精神科現場の気づき" },
  { key: "育児", label: "👨‍👩‍👧‍👦 8人育児のリアル" },
  { key: "豆知識", label: "🧠 心理学・脳科学の豆知識" },
  { key: "当事者へ", label: "💌 当事者への寄り添い" },
] as const;

export default function CharacterPage() {
  const [password, setPassword] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyOne = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // AIの出力を【現場】【育児】【豆知識】【当事者へ】の4ブロックにパースする
  const parseResult = (text: string): Record<string, string> => {
    const parsed: Record<string, string> = {};
    const labels = CATEGORIES.map((c) => c.key);
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const nextLabel = labels[i + 1];
      const startMarker = `【${label}】`;
      const startIdx = text.indexOf(startMarker);
      if (startIdx === -1) continue;
      const contentStart = startIdx + startMarker.length;
      const endIdx = nextLabel ? text.indexOf(`【${nextLabel}】`, contentStart) : text.length;
      const content = text.slice(contentStart, endIdx === -1 ? text.length : endIdx).trim();
      parsed[label] = content;
    }
    return parsed;
  };

  const generateAll = async () => {
    setError("");
    setResults({});
    try {
      const recentByCategory: Record<string, string[]> = {};
      for (const c of CATEGORIES) {
        recentByCategory[c.key] = getRecentBySubType(`character_${c.key}`, 5);
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-password": password },
        body: JSON.stringify({ mode: "character_all", recentByCategory }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const parsed = parseResult(data.text);
      setResults(parsed);

      // 4本それぞれを、カテゴリ別の履歴として個別に保存する
      for (const c of CATEGORIES) {
        if (parsed[c.key]) {
          saveHistoryEntry({ category: "character", subType: `character_${c.key}`, content: parsed[c.key] });
        }
      }
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
        <div className="text-xs text-gray-400">
          ボタン1つで、4カテゴリすべての投稿を1回で作成します（個別に作るよりコストを抑えられます）。
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-4">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</div>}
          <GenerateButton label="✨ 4カテゴリまとめて生成する" onGenerate={generateAll} />
        </div>

        {Object.keys(results).length > 0 && (
          <div className="space-y-3">
            {CATEGORIES.map((c) => {
              const text = results[c.key];
              if (!text) return null;
              return (
                <div key={c.key} className="rounded-xl bg-white border-2 border-ink p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-gray-500">{c.label}</div>
                    <button
                      onClick={() => copyOne(c.key, text)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-ink text-white"
                    >
                      {copiedKey === c.key ? "✓ コピー済み" : "コピー"}
                    </button>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{text}</div>
                  <div className="text-xs text-gray-400 mt-2">{text.length}文字</div>
                </div>
              );
            })}
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
