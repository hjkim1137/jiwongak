import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { getServerClient } from "@/lib/supabase-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ),
  title: "지원각 (Jiwongak) — 이 공고 지원각이야?",
  description:
    "채용공고를 붙여넣으면 당신의 경력·역량·라이프스타일과 매칭해 지원 적합도와 산업/직무 주의사항을 알려주는 AI 서비스",
  openGraph: {
    title: "지원각 — 이 공고 지원각이야?",
    description:
      "채용공고를 붙여넣으면 경력·역량·라이프스타일 기준으로 지원 적합도를 AI가 분석해드려요",
    siteName: "지원각",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "지원각 — 이 공고 지원각이야?",
    description:
      "채용공고를 붙여넣으면 경력·역량·라이프스타일 기준으로 지원 적합도를 AI가 분석해드려요",
  },
};

async function AppHeader() {
  let user = null;
  try {
    const supabase = await getServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // 비로그인 상태로 처리
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-base font-bold text-neutral-900 transition-colors hover:text-neutral-600"
        >
          지원각
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/history"
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                내 히스토리
              </Link>
              <Link
                href="/account"
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                계정
              </Link>
              <Link
                href="/analyze"
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
              >
                공고 분석하기
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                로그인
              </Link>
              <Link
                href="/diagnosis"
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
              >
                무료로 시작하기
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-neutral-100">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 text-xs text-neutral-400">
        <span className="font-medium">지원각</span>
        <span>© 2026 Jiwongak · AI 채용공고 적합도 분석 서비스</span>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <div className="flex flex-1 flex-col">{children}</div>
            <AppFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
