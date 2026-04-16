"use client";

import Link from "next/link";
import { useDiagnosisStore } from "@/lib/stores/diagnosis-store";
import { LIFESTYLE_TYPE_META } from "@/types/diagnosis";

export default function DiagnosisResultPage() {
  const { result, jobCategory, careerStage, reset } = useDiagnosisStore();

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center font-sans">
        <div className="text-center">
          <p className="text-neutral-500">진단 결과가 없습니다</p>
          <Link
            href="/diagnosis"
            className="mt-4 inline-block text-sm text-neutral-900 underline"
          >
            진단하러 가기
          </Link>
        </div>
      </main>
    );
  }

  const meta = LIFESTYLE_TYPE_META[result.lifestyleType];

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12 font-sans">
      <div className="w-full max-w-lg space-y-8">
        {/* 타입 카드 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <span className="text-5xl">{meta.emoji}</span>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">
            {meta.label}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            {meta.summary}
          </p>
        </div>

        {/* 요약 정보 */}
        <div className="rounded-xl bg-neutral-50 p-5 text-sm text-neutral-600">
          <div className="flex justify-between">
            <span>직군</span>
            <span className="font-medium text-neutral-900">{jobCategory}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>경력</span>
            <span className="font-medium text-neutral-900">
              {careerStage === "entry"
                ? "신입"
                : careerStage === "junior"
                  ? "주니어"
                  : "시니어"}
            </span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>top1-top2 gap</span>
            <span className="font-medium text-neutral-900">
              {result.topGap}
            </span>
          </div>
        </div>

        {/* 타입별 점수 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-neutral-700">
            타입별 점수
          </h3>
          {Object.entries(result.typeScores)
            .sort(([, a], [, b]) => b - a)
            .map(([type, score]) => {
              const typeMeta =
                LIFESTYLE_TYPE_META[
                  type as keyof typeof LIFESTYLE_TYPE_META
                ];
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="w-5 text-center">{typeMeta.emoji}</span>
                  <span className="w-32 text-xs text-neutral-500 truncate">
                    {typeMeta.label}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-700 transition-all"
                        style={{
                          width: `${Math.min((score / 14) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-6 text-right text-xs font-mono text-neutral-500">
                    {score}
                  </span>
                </div>
              );
            })}
        </div>

        {/* 액션 */}
        <div className="flex gap-3">
          <Link
            href="/analyze"
            className="flex-1 rounded-lg bg-neutral-900 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            공고 분석하기
          </Link>
          <button
            onClick={() => {
              reset();
              window.location.href = "/diagnosis";
            }}
            className="rounded-lg border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            다시 하기
          </button>
        </div>
      </div>
    </main>
  );
}
