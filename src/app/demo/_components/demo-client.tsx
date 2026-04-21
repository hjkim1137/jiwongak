"use client";

import { useState } from "react";
import Link from "next/link";
import { DEMO_POSTINGS } from "../../../../data/demo-postings";
import { AnalysisResultPreview, LABEL_META } from "../../analyze/_components/analysis-result-preview";

export function DemoClient() {
  const [active, setActive] = useState(0);
  const demo = DEMO_POSTINGS[active];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">분석 결과 미리보기</h1>
        <p className="mt-2 text-sm text-neutral-500">
          5가지 케이스로 지원각 분석 결과를 확인해보세요
        </p>
      </div>

      {/* 탭 */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {DEMO_POSTINGS.map((p, i) => {
          const meta = LABEL_META[p.result.label];
          const isActive = i === active;
          return (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? `${meta.bg} ${meta.color} ${meta.border} border`
                  : "border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              {meta.emoji} {p.result.label}
            </button>
          );
        })}
      </div>

      {/* 공고 메타 */}
      <div className="mb-6 rounded-xl border border-neutral-100 bg-neutral-50 px-5 py-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">예시 공고</p>
        <p className="mt-1 font-semibold text-neutral-800">{demo.position}</p>
        <p className="text-sm text-neutral-500">{demo.companyType}</p>
        <p className="mt-2 text-xs text-neutral-400 italic">{demo.scenario}</p>
      </div>

      {/* 분석 결과 */}
      <AnalysisResultPreview result={demo.result} />

      {/* CTA */}
      <div className="mt-10 rounded-2xl border border-neutral-100 bg-neutral-50 p-6 text-center">
        <p className="font-medium text-neutral-800">내 공고를 직접 분석해보세요</p>
        <p className="mt-1 text-sm text-neutral-500">
          진단을 완료하면 내 스킬·경력·라이프스타일 기준으로 분석해드려요
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/diagnosis"
            className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            진단 시작하기
          </Link>
          <Link
            href="/analyze"
            className="rounded-lg border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            공고 바로 분석하기
          </Link>
        </div>
      </div>
    </div>
  );
}
