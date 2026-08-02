"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "hisyo_pw_verified";

// ダッシュボード用の簡易パスワードを保持するhook。
// API呼び出し時のヘッダーにこのパスワードをそのまま乗せて使う。
export function useDashboardPassword() {
  const [password, setPassword] = useState<string>("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setPassword(saved);
      setVerified(true);
    }
  }, []);

  const submit = (pw: string) => {
    sessionStorage.setItem(SESSION_KEY, pw);
    setPassword(pw);
    setVerified(true);
  };

  return { password, verified, submit };
}

export default function PasswordGate({
  onVerified,
  children,
}: {
  onVerified: (password: string) => void;
  children: React.ReactNode;
}) {
  const { verified, submit } = useDashboardPassword();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (verified) {
      const saved = sessionStorage.getItem(SESSION_KEY) || "";
      onVerified(saved);
    }
  }, [verified]);

  if (verified) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-lg font-bold">🔒 パスワードを入力</div>
      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2.5 w-64 text-center"
        placeholder="パスワード"
      />
      <button
        onClick={() => submit(input)}
        className="px-6 py-2.5 rounded-lg bg-ink text-white text-sm font-bold"
      >
        入る
      </button>
    </div>
  );
}
