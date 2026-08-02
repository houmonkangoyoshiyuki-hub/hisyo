"use client";

import { useEffect, useState } from "react";
import { HistoryEntry, loadHistory, toggleFavorite, deleteHistoryEntry } from "@/lib/storage";

type Props = {
  category: HistoryEntry["category"];
  refreshKey?: number; // 親から値を変えて再読込を促す
};

export default function HistoryPanel({ category, refreshKey }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    setEntries(loadHistory().filter((e) => e.category === category));
  }, [category, refreshKey]);

  const copy = (id: number, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fav = (id: number) => {
    setEntries(toggleFavorite(id).filter((e) => e.category === category));
  };

  const del = (id: number) => {
    setEntries(deleteHistoryEntry(id).filter((e) => e.category === category));
  };

  if (entries.length === 0) {
    return <div className="text-sm text-gray-400 text-center py-8">まだ生成履歴がありません。</div>;
  }

  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <div key={e.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              {e.subType}　{e.createdAt}
            </span>
            <button onClick={() => fav(e.id)} className="text-lg">
              {e.favorite ? "⭐" : "☆"}
            </button>
          </div>
          <div className="text-sm whitespace-pre-wrap mb-3 text-ink">{e.content}</div>
          <div className="flex gap-2">
            <button
              onClick={() => copy(e.id, e.content)}
              className="flex-1 py-2 rounded-lg text-xs font-bold bg-ink text-white"
            >
              {copiedId === e.id ? "✓ コピー済み" : "コピー"}
            </button>
            <button
              onClick={() => del(e.id)}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-600"
            >
              削除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
