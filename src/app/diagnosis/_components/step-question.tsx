"use client";

import { useDiagnosisStore } from "@/lib/stores/diagnosis-store";
import type { Question } from "@/types/diagnosis";
import { QUESTION_IDS } from "@/types/diagnosis";

type Props = {
  question: Question;
  questionIndex: number;
  /** 마지막 문항에서 선택 시 호출 (진단 완료 처리) */
  onComplete?: () => void;
  isLast?: boolean;
};

export function StepQuestion({
  question,
  questionIndex,
  onComplete,
  isLast,
}: Props) {
  const { answers, setAnswer, next } = useDiagnosisStore();
  const qId = QUESTION_IDS[questionIndex];
  const selected = qId ? answers[qId] : undefined;

  const handleSelect = (optionId: "A" | "B") => {
    if (!qId) return;
    setAnswer(qId, optionId);
    if (isLast && onComplete) {
      setTimeout(onComplete, 300);
    } else {
      setTimeout(next, 300);
    }
  };

  return (
    <div className="space-y-6">
      {/* 테마 태그 */}
      <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
        {question.theme}
      </span>

      {/* 질문 */}
      <h2 className="text-xl font-bold leading-snug text-neutral-900">
        {question.prompt}
      </h2>

      {/* 양자택일 카드 */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`w-full cursor-pointer rounded-xl border-2 px-5 py-4 text-left transition-all ${
                isSelected
                  ? "border-neutral-900 bg-neutral-900"
                  : "border-neutral-200 bg-white hover:border-neutral-400"
              }`}
            >
              <span
                className={`text-sm leading-relaxed ${
                  isSelected ? "font-medium text-white" : "text-neutral-600"
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
