import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "秘書 | Hisyo",
  description: "営業・マーケティング・小説執筆を半自動化する個人用ダッシュボード",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
