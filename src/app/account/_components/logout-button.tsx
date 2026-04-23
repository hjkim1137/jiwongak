"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase";

type Props = {
  variant?: "primary" | "secondary";
  className?: string;
};

export function LogoutButton({ variant = "secondary", className = "" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  const base =
    "rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const style =
    variant === "primary"
      ? "bg-neutral-900 text-white hover:bg-neutral-800"
      : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50";

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`${base} ${style} ${className}`}
    >
      {loading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
