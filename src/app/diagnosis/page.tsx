"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDiagnosisStore } from "@/lib/stores/diagnosis-store";
import { StepQ0 } from "./_components/step-q0";
import { StepQuestion } from "./_components/step-question";
import { ProgressBar } from "./_components/progress-bar";
import { QUESTIONS } from "@/lib/diagnosis/questions";
import { LIFESTYLE_TYPE_META } from "@/types/diagnosis";
import { classifyType } from "@/lib/diagnosis/classify-type";
import type { DiagnosisAnswers } from "@/types/diagnosis";

export default function DiagnosisPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const { step, totalSteps, canGoNext, next, prev, isComplete, getAnswers, result, reset } =
    useDiagnosisStore();

  // 이미 진단 완료 상태 → 결과 요약 + 재진단 선택 화면
  // isNavigating 중에는 표시하지 않음 (setState 직후 재렌더 플래시 방지)
  if (result && !isNavigating) {
    const meta = LIFESTYLE_TYPE_META[result.lifestyleType];
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-12 font-sans">
        <div className="w-full max-w-lg space-y-6">
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-8 text-center">
            <span className="text-5xl">{meta.emoji}</span>
            <h2 className="mt-4 text-xl font-bold text-neutral-800">{meta.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">{meta.summary}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/analyze")}
              className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              공고 분석하러 가기
            </button>
            <button
              onClick={() => {
                reset();
              }}
              className="w-full rounded-lg border border-neutral-200 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              진단 다시 하기
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isQ0 = step === 0;
  const questionIndex = step - 1;
  const question = !isQ0 ? QUESTIONS[questionIndex] : null;
  const isLastStep = step === totalSteps - 1;

  const handleComplete = () => {
    if (!isComplete()) return;
    setIsNavigating(true);
    const answers = getAnswers() as DiagnosisAnswers;
    const diagResult = classifyType(answers);
    useDiagnosisStore.setState({ result: diagResult });
    router.push("/diagnosis/result");
  };

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12 font-sans">
      <div className="w-full max-w-lg">
        {/* 진행 바 */}
        <ProgressBar current={step} total={totalSteps} />

        {/* 문항 */}
        <div className="mt-8">
          {isQ0 ? (
            <StepQ0 />
          ) : question ? (
            <StepQuestion
              key={question.id}
              question={question}
              questionIndex={questionIndex}
              isLast={isLastStep}
              onComplete={handleComplete}
            />
          ) : null}
        </div>

        {/* 네비게이션 */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 disabled:invisible"
          >
            이전
          </button>

          {/* Q0에서만 "다음" 버튼 표시. Q1~Q8은 선택 즉시 자동 이동 */}
          {isQ0 && (
            <button
              onClick={next}
              disabled={!canGoNext()}
              className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
            </button>
          )}
        </div>

        {/* 하단 안내 */}
        <p className="mt-6 text-center text-xs text-neutral-400">
          {step + 1} / {totalSteps}
          {!isQ0 && question && (
            <span className="ml-2 text-neutral-300">· {question.theme}</span>
          )}
        </p>
      </div>
    </main>
  );
}
