import Link from "next/link";
import { AnalyzeForm } from "./_components/analyze-form";

export default function AnalyzePage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8 sm:py-12 font-sans">
      <div className="w-full max-w-2xl space-y-8">
        {/* 헤더 */}
        <div>
          <Link
            href="/"
            className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ← 홈
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">
            공고 분석
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            채용공고를 붙여넣으면 나의 역량·경력·라이프스타일 기반으로 적합도를
            분석합니다
          </p>
        </div>

        <AnalyzeForm />
      </div>
    </main>
  );
}
