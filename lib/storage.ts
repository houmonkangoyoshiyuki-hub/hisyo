export type HistoryEntry = {
  id: number;
  category: "medical" | "novel" | "research";
  subType: string; // 例: "x_ケアラボ", "novel_続きを書く", "research_weekly"
  content: string;
  favorite: boolean;
  createdAt: string;
};

const HISTORY_KEY = "hisyo_history_v1";
const MAX_HISTORY = 300;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: Omit<HistoryEntry, "id" | "createdAt" | "favorite">): HistoryEntry {
  const list = loadHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: Date.now(),
    favorite: false,
    createdAt: new Date().toLocaleString("ja-JP"),
  };
  const updated = [newEntry, ...list].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return newEntry;
}

export function toggleFavorite(id: number): HistoryEntry[] {
  const list = loadHistory();
  const updated = list.map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteHistoryEntry(id: number): HistoryEntry[] {
  const list = loadHistory();
  const updated = list.filter((e) => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

// 直近N件の投稿内容（同じsubTypeのもの）を取得。生成時に「これと被らないように」渡すために使う
export function getRecentBySubType(subType: string, limit: number = 10): string[] {
  const list = loadHistory();
  return list
    .filter((e) => e.subType === subType)
    .slice(0, limit)
    .map((e) => e.content.slice(0, 120));
}

// 高評価（⭐）だった投稿を取得。次回生成時に「好評だったテイスト」として参照する
export function getFavoritesBySubType(subType: string, limit: number = 5): string[] {
  const list = loadHistory();
  return list
    .filter((e) => e.subType === subType && e.favorite)
    .slice(0, limit)
    .map((e) => e.content);
}
