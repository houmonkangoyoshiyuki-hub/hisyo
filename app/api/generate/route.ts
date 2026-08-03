import { NextRequest, NextResponse } from "next/server";
import { buildMedicalSystemPrompt, buildNovelSystemPrompt, buildThumbnailPrompt, buildCharacterPostPrompt, buildAllCategoriesPrompt, buildAllAppsMedicalPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 簡易パスワード認証（1人用ダッシュボードのため）
  const auth = req.headers.get("x-dashboard-password");
  if (auth !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEYが設定されていません" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { mode } = body; // "medical" | "novel" | "thumbnail" | "character" | "character_all"

    let systemPrompt = "";
    let userMessage = "";
    let maxTokens = 2000;

    if (mode === "medical") {
      const { contentType, targetApp, task, recentPosts } = body;
      systemPrompt = buildMedicalSystemPrompt({ contentType, targetApp, recentPosts: recentPosts || [] });
      userMessage = task || "今日の投稿を1本作成してください。";
    } else if (mode === "novel") {
      const { task } = body;
      systemPrompt = buildNovelSystemPrompt(task || "続きを書いてください。");
      userMessage = task || "続きを書いてください。";
    } else if (mode === "thumbnail") {
      const { task } = body;
      systemPrompt = buildThumbnailPrompt(task || "サムネイル画像のプロンプトを作成してください。");
      userMessage = task || "サムネイル画像のプロンプトを作成してください。";
    } else if (mode === "character") {
      const { category, recentPosts } = body;
      systemPrompt = buildCharacterPostPrompt({ category, recentPosts: recentPosts || [] });
      userMessage = `「${category}」カテゴリの投稿を1本作成してください。`;
    } else if (mode === "character_all") {
      const { recentByCategory } = body; // { 現場: string[], 育児: string[], 豆知識: string[], 当事者へ: string[] }
      systemPrompt = buildAllCategoriesPrompt(recentByCategory || {});
      userMessage = "4カテゴリすべての投稿を、指定の出力形式で作成してください。";
      maxTokens = 2500;
    } else if (mode === "medical_all") {
      const { contentType, recentByApp } = body; // recentByApp: { ケアラボ: string[], "Dr.Assistant": string[], メディノート: string[] }
      systemPrompt = buildAllAppsMedicalPrompt({ contentType, recentByApp: recentByApp || {} });
      userMessage = "3アプリすべての投稿を、指定の出力形式で作成してください。";
      maxTokens = contentType === "note" ? 4000 : 2000;
    } else {
      return NextResponse.json({ error: "不正なmodeです" }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Claude APIエラー: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const text = data.content?.find((b: any) => b.type === "text")?.text || "";

    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "生成中にエラーが発生しました" }, { status: 500 });
  }
}
