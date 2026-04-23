"use client";

export type AnalysisStep = "parsing" | "insights" | "scoring";

const STEPS: { key: AnalysisStep; label: string; sub: string }[] = [
  { key: "parsing", label: "공고 파싱", sub: "직무·자격 요건 추출" },
  { key: "insights", label: "인사이트 검색", sub: "관련 데이터 조회" },
  { key: "scoring", label: "점수 산출", sub: "AI 매칭 분석" },
];

const STEP_INDEX: Record<AnalysisStep, number> = {
  parsing: 0,
  insights: 1,
  scoring: 2,
};

export function AnalysisProgress({ step }: { step: AnalysisStep }) {
  const activeIndex = STEP_INDEX[step];

  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-6 py-8">
      <div className="flex items-start">
        {STEPS.map((s, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;

          return (
            <div key={s.key} className="relative flex flex-1 flex-col items-center">
              {/* 이전 단계와의 연결선 */}
              {i > 0 && (
                <div
                  className={`absolute top-[17px] right-1/2 h-px w-full transition-colors ${
                    i <= activeIndex ? "bg-neutral-700" : "bg-neutral-200"
                  }`}
                />
              )}

              {/* 단계 원형 아이콘 */}
              <div
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                  isDone
                    ? "border-neutral-900 bg-neutral-900"
                    : isActive
                      ? "border-neutral-700 bg-white"
                      : "border-neutral-200 bg-white"
                }`}
              >
                {isDone && (
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path
                      d="M1 5L5 9L13 1"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isActive && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
                )}
                {!isDone && !isActive && (
                  <div className="h-2 w-2 rounded-full bg-neutral-300" />
                )}
              </div>

              {/* 단계 레이블 */}
              <div
                className={`mt-3 text-center transition-opacity ${
                  !isDone && !isActive ? "opacity-35" : ""
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    isActive ? "text-neutral-900" : "text-neutral-600"
                  }`}
                >
                  {s.label}
                  {isActive && (
                    <span className="animate-pulse text-neutral-400">...</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
