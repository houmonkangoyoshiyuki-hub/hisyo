"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";
import GenerateButton from "@/components/GenerateButton";
import HistoryPanel from "@/components/HistoryPanel";
import { saveHistoryEntry, getRecentBySubType, getFavoritesBySubType } from "@/lib/storage";

const APPS = ["ケアラボ", "Dr.Assistant", "メディノート"];
const CONTENT_TYPES: { key: "x" | "threads" | "note"; label: string }[] = [
  { key: "x", label: "X投稿" },
  { key: "threads", label: "Threads投稿" },
  { key: "note", label: "note記事" },
];

export default function MedicalPage() {
  const [password, setPassword] = useState("");
  const [targetApp, setTargetApp] = useState(APPS[0]);
  const [contentType, setContentType] = useState<"x" | "threads" | "note">("x");
  const [theme, setTheme] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const copyResult = () => {
    navigator.clipboard?.writeText(result).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const subType = `${contentType}_${targetApp}`;

  const generate = async () => {
    setError("");
    setResult("");
    try {
      const recentPosts = getRecentBySubType(subType, 10);
      const favorites = getFavoritesBySubType(subType, 5);
      const favNote =
        favorites.length > 0
          ? `\n\n過去に好評だった投稿例（テイストを参考にしてください）：\n${favorites.join("\n---\n")}`
          : "";

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-password": password },
        body: JSON.stringify({
          mode: "medical",
          contentType,
          targetApp,
          recentPosts,
          task: `${targetApp}についての投稿を1本作成してください。${
            theme ? `テーマ・切り口の希望：${theme}` : "テーマは自由に、現場のあるあるから考えてください。"
          }${favNote}`,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data.text);
      saveHistoryEntry({ category: "medical", subType, content: data.text });
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

        <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-4">
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1.5">対象アプリ</div>
            <div className="flex gap-2">
              {APPS.map((a) => (
                <button
                  key={a}
                  onClick={() => setTargetApp(a)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                    targetApp === a ? "bg-ink text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

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
          </div>

          <div>
            <div className="text-xs font-bold text-gray-500 mb-1.5">テーマ・切り口（任意）</div>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例: 夜勤の申し送りがいつも長引く問題"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <GenerateButton label="✨ 生成する" onGenerate={generate} />
        </div>

        {result && (
          <div className="rounded-xl bg-white border-2 border-ink p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-500">生成結果</div>
              <button
                onClick={copyResult}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-ink text-white"
              >
                {copied ? "✓ コピー済み" : "コピー"}
              </button>
            </div>
            <div className="text-sm whitespace-pre-wrap">{result}</div>
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
