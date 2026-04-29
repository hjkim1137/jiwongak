"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDiagnosisStore } from "@/lib/stores/diagnosis-store";
import { StepQ0 } from "./_components/step-q0";
import { StepQuestion } from "./_components/step-question";
import { StepPersonality } from "./_components/step-personality";
import { ProgressBar } from "./_components/progress-bar";
import { QUESTIONS } from "@/lib/diagnosis/questions";
import { PERSONALITY_QUESTIONS } from "@/lib/diagnosis/personality-questions";
import { LIFESTYLE_TYPE_META } from "@/types/diagnosis";
import { classifyType } from "@/lib/diagnosis/classify-type";
import { classifyPersonality } from "@/lib/diagnosis/classify-personality";
import type { DiagnosisAnswers } from "@/types/diagnosis";
import type { PersonalityAnswers } from "@/types/personality";

const Q1_FIRST_STEP = 1;
const P1_FIRST_STEP = 1 + QUESTIONS.length; // 9

export default function DiagnosisPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const {
    step,
    totalSteps,
    canGoNext,
    next,
    prev,
    isComplete,
    getAnswers,
    getPersonalityAnswers,
    result,
    reset,
  } = useDiagnosisStore();

  // 이미 진단 완료 상태 → 결과 요약 + 재진단 선택 화면
  // isNavigating 중에는 표시하지 않음 (setState 직후 재렌더 플래시 방지)
  if (result && !isNavigating) {
    const meta = LIFESTYLE_TYPE_META[result.lifestyleType];
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-8 sm:py-12 font-sans">
        <div className="w-full max-w-lg space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            홈
          </Link>
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-6 sm:p-8 text-center">
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
  const isLifestyleStep = step >= Q1_FIRST_STEP && step < P1_FIRST_STEP;
  const isPersonalityStep = step >= P1_FIRST_STEP;

  const lifestyleQuestion = isLifestyleStep
    ? QUESTIONS[step - Q1_FIRST_STEP]
    : null;
  const personalityQuestion = isPersonalityStep
    ? PERSONALITY_QUESTIONS[step - P1_FIRST_STEP]
    : null;

  const isLastStep = step === totalSteps - 1;
  // 라이프스타일 마지막 단계(Q8) 직후에 한 번 안내 — 성격 섹션 진입 안내는
  // 헤더 태그(축 라벨)로도 노출되므로 별도 인터스티셜은 두지 않는다.

  const handleComplete = () => {
    if (!isComplete()) return;
    setIsNavigating(true);
    const answers = getAnswers() as DiagnosisAnswers;
    const personalityAnswers = getPersonalityAnswers() as PersonalityAnswers;
    const lifestyleResult = classifyType(answers);
    const personality = classifyPersonality(personalityAnswers);
    useDiagnosisStore.setState({
      result: { ...lifestyleResult, personality },
    });
    router.push("/diagnosis/result");
  };

  const themeLabel = lifestyleQuestion
    ? lifestyleQuestion.theme
    : personalityQuestion
      ? personalityQuestion.theme
      : null;

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8 sm:py-12 font-sans">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          홈
        </Link>

        <ProgressBar current={step} total={totalSteps} />

        <div className="mt-8">
          {isQ0 ? (
            <StepQ0 />
          ) : lifestyleQuestion ? (
            <StepQuestion
              key={lifestyleQuestion.id}
              question={lifestyleQuestion}
              questionIndex={step - Q1_FIRST_STEP}
              isLast={false}
              onComplete={undefined}
            />
          ) : personalityQuestion ? (
            <StepPersonality
              key={personalityQuestion.id}
              question={personalityQuestion}
              questionIndex={step - P1_FIRST_STEP}
              isLast={isLastStep}
              onComplete={handleComplete}
            />
          ) : null}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 disabled:invisible"
          >
            이전
          </button>

          {/* Q0에서만 "다음" 버튼 표시. Q1~Q8 / P1~P6은 선택 즉시 자동 이동 */}
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

        <p className="mt-6 text-center text-xs text-neutral-400">
          {step + 1} / {totalSteps}
          {themeLabel && (
            <span className="ml-2 text-neutral-300">· {themeLabel}</span>
          )}
        </p>
      </div>
    </main>
  );
}
