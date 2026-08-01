"use client";

import { useState } from "react";

type Props = {
  label: string;
  onGenerate: () => Promise<void>;
  className?: string;
};

export default function GenerateButton({ label, onGenerate, className }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onGenerate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        className ||
        "w-full py-3.5 rounded-xl text-sm font-bold bg-ink text-white disabled:opacity-50 transition active:scale-[0.98]"
      }
    >
      {loading ? "生成中…" : label}
    </button>
  );
}
