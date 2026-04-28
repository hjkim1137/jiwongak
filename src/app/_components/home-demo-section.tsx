"use client";

import { useState } from "react";
import { DEMO_POSTINGS } from "../../../data/demo-postings";
import { AnalysisResultPreview, LABEL_META } from "../analyze/_components/analysis-result-preview";

export function HomeDemoSection() {
  const [active, setActive] = useState(0);
  const demo = DEMO_POSTINGS[active];

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium text-neutral-400">실제 분석 결과</p>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            이런 결과를 받아볼 수 있어요
          </h2>
          <p className="mt-3 text-base text-neutral-500">
            5가지 케이스로 미리 확인해보세요
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {DEMO_POSTINGS.map((p, i) => {
            const meta = LABEL_META[p.result.label];
            const isActive = i === active;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${meta.bg} ${meta.color} ${meta.border} ${
                  isActive
                    ? `shadow-md ring-2 ring-offset-2 ${meta.ring}`
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                {meta.emoji} {p.result.label}
              </button>
            );
          })}
        </div>

        <div className="mx-auto max-w-lg">
          <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">예시 공고</p>
            <p className="mt-1 font-semibold text-neutral-800">{demo.position}</p>
            <p className="text-sm text-neutral-500">{demo.companyType}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs text-neutral-600">
                {demo.postingCategory}
              </span>
            </div>
            <p className="mt-2 text-xs italic text-neutral-400">{demo.scenario}</p>
          </div>

          <AnalysisResultPreview result={demo.result} />
        </div>
      </div>
    </section>
  );
}
