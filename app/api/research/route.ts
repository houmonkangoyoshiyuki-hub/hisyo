import { NextRequest, NextResponse } from "next/server";
import { RESEARCH_SYSTEM_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-dashboard-password");
  if (auth !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEYが設定されていません" }, { status: 500 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 3000,
        system: RESEARCH_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: "今週のビジネスリサーチをお願いします。直近のトレンド・ニュースを検索したうえで、厳選3件を提案してください。",
          },
        ],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Claude APIエラー: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    // web_search使用時はcontentに複数のtext blockが混在するため、すべて結合する
    const text = (data.content || [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");

    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "リサーチ中にエラーが発生しました" }, { status: 500 });
  }
}
