"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";
import GenerateButton from "@/components/GenerateButton";
import HistoryPanel from "@/components/HistoryPanel";
import { saveHistoryEntry, getRecentBySubType } from "@/lib/storage";

const APPS = ["ケアラボ", "Dr.Assistant", "メディノート"];
const CONTENT_TYPES: { key: "x" | "threads" | "note"; label: string }[] = [
  { key: "x", label: "X投稿" },
  { key: "threads", label: "Threads投稿" },
  { key: "note", label: "note記事" },
];

export default function MedicalPage() {
  const [password, setPassword] = useState("");
  const [contentType, setContentType] = useState<"x" | "threads" | "note">("x");
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyOne = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // AIの出力を【ケアラボ】【Dr.Assistant】【メディノート】の3ブロックにパースする
  const parseResult = (text: string): Record<string, string> => {
    const parsed: Record<string, string> = {};
    for (let i = 0; i < APPS.length; i++) {
      const app = APPS[i];
      const nextApp = APPS[i + 1];
      const startMarker = `【${app}】`;
      const startIdx = text.indexOf(startMarker);
      if (startIdx === -1) continue;
      const contentStart = startIdx + startMarker.length;
      const endIdx = nextApp ? text.indexOf(`【${nextApp}】`, contentStart) : text.length;
      const content = text.slice(contentStart, endIdx === -1 ? text.length : endIdx).trim();
      parsed[app] = content;
    }
    return parsed;
  };

  const generateAll = async () => {
    setError("");
    setResults({});
    try {
      const recentByApp: Record<string, string[]> = {};
      for (const app of APPS) {
        recentByApp[app] = getRecentBySubType(`${contentType}_${app}`, 5);
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-password": password },
        body: JSON.stringify({ mode: "medical_all", contentType, recentByApp }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const parsed = parseResult(data.text);
      setResults(parsed);

      for (const app of APPS) {
        if (parsed[app]) {
          saveHistoryEntry({ category: "medical", subType: `${contentType}_${app}`, content: parsed[app] });
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
        <h1 className="text-xl font-bold">🩺 医療系営業・マーケティング</h1>
        <div className="text-xs text-gray-400">
          ボタン1つで、ケアラボ・Dr.Assistant・メディノート、3アプリ分をまとめて作成します。
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-4">
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1.5">コンテンツ種別</div>
            <div className="flex gap-2">
              {CONTENT_TYPES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setContentType(c.key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                    contentType === c.key ? "bg-ink text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {contentType !== "note" && (
              <div className="text-xs text-gray-400 mt-1.5">
                X/Threadsはリンク無しで「気になる方はプロフィールへ」で締める形にしています。
              </div>
            )}
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <GenerateButton label="✨ 3アプリまとめて生成する" onGenerate={generateAll} />
        </div>

        {Object.keys(results).length > 0 && (
          <div className="space-y-3">
            {APPS.map((app) => {
              const text = results[app];
              if (!text) return null;
              return (
                <div key={app} className="rounded-xl bg-white border-2 border-ink p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-gray-500">{app}</div>
                    <button
                      onClick={() => copyOne(app, text)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-ink text-white"
                    >
                      {copiedKey === app ? "✓ コピー済み" : "コピー"}
                    </button>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{text}</div>
                </div>
              );
            })}
          </div>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-500 mb-2">📂 履歴</h2>
          <HistoryPanel category="medical" refreshKey={refreshKey} />
        </section>
      </main>
    </PasswordGate>
  );
}
