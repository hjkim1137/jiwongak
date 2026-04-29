"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { JobCategory } from "@/types/analysis";
import type {
  CareerStage,
  DiagnosisAnswers,
  DiagnosisResult,
  OptionId,
  Q0Answer,
  QuestionId,
} from "@/types/diagnosis";
import { QUESTION_IDS } from "@/types/diagnosis";
import {
  PERSONALITY_QUESTION_IDS,
  type PersonalityAnswers,
  type PersonalityOptionId,
  type PersonalityQuestionId,
} from "@/types/personality";

/**
 * step 매핑:
 *  - 0: Q0 (직군/경력)
 *  - 1~8: Q1~Q8 (라이프스타일)
 *  - 9~14: P1~P6 (성격)
 */
type Step = number;

type DiagnosisState = {
  // ── Q0 ──
  jobCategory: JobCategory | null;
  careerStage: CareerStage | null;

  // ── Q1~Q8 ──
  answers: Partial<DiagnosisAnswers>;

  // ── P1~P6 ──
  personalityAnswers: Partial<PersonalityAnswers>;

  // ── 결과 ──
  result: DiagnosisResult | null;

  // ── 네비게이션 ──
  step: Step; // 0 ~ 14
  totalSteps: number; // 15 (Q0 + Q1~Q8 + P1~P6)

  // ── 액션 ──
  setQ0: (jobCategory: JobCategory, careerStage: CareerStage) => void;
  setAnswer: (questionId: QuestionId, optionId: OptionId) => void;
  setPersonalityAnswer: (
    questionId: PersonalityQuestionId,
    optionId: PersonalityOptionId,
  ) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;

  // ── 파생 ──
  canGoNext: () => boolean;
  isComplete: () => boolean;
  getQ0Answer: () => Q0Answer | null;
  getAnswers: () => DiagnosisAnswers | null;
  getPersonalityAnswers: () => PersonalityAnswers | null;
};

const Q1_FIRST_STEP = 1;
const P1_FIRST_STEP = 1 + QUESTION_IDS.length; // 9
const TOTAL_STEPS =
  1 + QUESTION_IDS.length + PERSONALITY_QUESTION_IDS.length; // 15

export const useDiagnosisStore = create<DiagnosisState>()(
  persist(
    (set, get) => ({
      jobCategory: null,
      careerStage: null,
      answers: {},
      personalityAnswers: {},
      result: null,
      step: 0,
      totalSteps: TOTAL_STEPS,

      setQ0: (jobCategory, careerStage) => set({ jobCategory, careerStage }),

      setAnswer: (questionId, optionId) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: optionId },
        })),

      setPersonalityAnswer: (questionId, optionId) =>
        set((state) => ({
          personalityAnswers: {
            ...state.personalityAnswers,
            [questionId]: optionId,
          },
        })),

      next: () =>
        set((state) => ({
          step: Math.min(state.step + 1, TOTAL_STEPS - 1),
        })),

      prev: () =>
        set((state) => ({
          step: Math.max(state.step - 1, 0),
        })),

      reset: () =>
        set({
          jobCategory: null,
          careerStage: null,
          answers: {},
          personalityAnswers: {},
          result: null,
          step: 0,
        }),

      canGoNext: () => {
        const { step, jobCategory, careerStage, answers, personalityAnswers } =
          get();
        if (step === 0) return jobCategory !== null && careerStage !== null;
        if (step < P1_FIRST_STEP) {
          const qId = QUESTION_IDS[step - Q1_FIRST_STEP];
          return qId !== undefined && answers[qId] !== undefined;
        }
        const pId = PERSONALITY_QUESTION_IDS[step - P1_FIRST_STEP];
        return pId !== undefined && personalityAnswers[pId] !== undefined;
      },

      isComplete: () => {
        const { jobCategory, careerStage, answers, personalityAnswers } =
          get();
        if (!jobCategory || !careerStage) return false;
        const lifestyleDone = QUESTION_IDS.every(
          (qId) => answers[qId] !== undefined,
        );
        const personalityDone = PERSONALITY_QUESTION_IDS.every(
          (pId) => personalityAnswers[pId] !== undefined,
        );
        return lifestyleDone && personalityDone;
      },

      getQ0Answer: () => {
        const { jobCategory, careerStage } = get();
        if (!jobCategory || !careerStage) return null;
        return { jobCategory, careerStage };
      },

      getAnswers: () => {
        const { answers } = get();
        const complete = QUESTION_IDS.every(
          (qId) => answers[qId] !== undefined,
        );
        return complete ? (answers as DiagnosisAnswers) : null;
      },

      getPersonalityAnswers: () => {
        const { personalityAnswers } = get();
        const complete = PERSONALITY_QUESTION_IDS.every(
          (pId) => personalityAnswers[pId] !== undefined,
        );
        return complete ? (personalityAnswers as PersonalityAnswers) : null;
      },
    }),
    {
      name: "diagnosis-store",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
