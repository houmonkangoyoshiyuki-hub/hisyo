"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordGate from "@/components/PasswordGate";
import GenerateButton from "@/components/GenerateButton";
import HistoryPanel from "@/components/HistoryPanel";
import { saveHistoryEntry } from "@/lib/storage";

const TASKS = [
  { key: "continue", label: "✍️ 続きを書く" },
  { key: "promo", label: "📢 宣伝文を作成" },
  { key: "summary", label: "📋 章まとめを作成" },
] as const;

type TaskKey = (typeof TASKS)[number]["key"];

export default function NovelPage() {
  const [password, setPassword] = useState("");
  const [task, setTask] = useState<TaskKey>("continue");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const placeholder =
    task === "continue"
      ? "例: Series20を認知負荷バイアスで書きたい。悪役はICUの看護師長にしたい。EP77（起）から。"
      : task === "promo"
      ? "例: Series19「カリギュラ効果篇」の宣伝文をXに投稿したい"
      : "例: Series18「バーナム効果篇」EP69〜72のあらすじを300字でまとめたい";

  const generate = async () => {
    setError("");
    setResult("");
    try {
      const taskLabel = TASKS.find((t) => t.key === task)?.label || "";
      const fullTask = `【依頼タイプ】${taskLabel}\n【詳細指示】${context || "特になし。設定資料とサンプルの文体を踏まえて自然に作成してください。"}`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-password": password },
        body: JSON.stringify({ mode: "novel", task: fullTask }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data.text);
      saveHistoryEntry({ category: "novel", subType: `novel_${task}`, content: data.text });
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
        <h1 className="text-xl font-bold">📖 「ヒト、という実験」執筆支援</h1>

        <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-4">
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1.5">やること</div>
            <div className="flex gap-2">
              {TASKS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTask(t.key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                    task === t.key ? "bg-ink text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-gray-500 mb-1.5">詳細指示（あらすじ・希望など自由記述）</div>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <GenerateButton label="✨ 生成する" onGenerate={generate} />
        </div>

        {result && (
          <div className="rounded-xl bg-white border-2 border-ink p-4">
            <div className="text-xs font-bold text-gray-500 mb-2">生成結果</div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{result}</div>
          </div>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-500 mb-2">📂 履歴</h2>
          <HistoryPanel category="novel" refreshKey={refreshKey} />
        </section>
      </main>
    </PasswordGate>
  );
}
