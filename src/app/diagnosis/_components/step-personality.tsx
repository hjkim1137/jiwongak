"use client";

import { useDiagnosisStore } from "@/lib/stores/diagnosis-store";
import {
  PERSONALITY_AXIS_META,
  PERSONALITY_QUESTION_IDS,
  type PersonalityOptionId,
  type PersonalityQuestion,
} from "@/types/personality";

type Props = {
  question: PersonalityQuestion;
  /** P1~P6 중 0~5 인덱스 */
  questionIndex: number;
  isLast?: boolean;
  onComplete?: () => void;
};

export function StepPersonality({
  question,
  questionIndex,
  isLast,
  onComplete,
}: Props) {
  const { personalityAnswers, setPersonalityAnswer, next } =
    useDiagnosisStore();
  const pId = PERSONALITY_QUESTION_IDS[questionIndex];
  const selected = pId ? personalityAnswers[pId] : undefined;
  const axisMeta = PERSONALITY_AXIS_META[question.axis];

  const handleSelect = (optionId: PersonalityOptionId) => {
    if (!pId) return;
    setPersonalityAnswer(pId, optionId);
    if (isLast && onComplete) {
      setTimeout(onComplete, 300);
    } else {
      setTimeout(next, 300);
    }
  };

  return (
    <div className="space-y-6">
      {/* 축 + 테마 태그 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-block rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
          {axisMeta.label}
        </span>
        <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
          {question.theme}
        </span>
      </div>

      <h2 className="text-xl font-bold leading-snug text-neutral-900">
        {question.prompt}
      </h2>

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
