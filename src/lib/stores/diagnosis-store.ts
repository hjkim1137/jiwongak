"use client";

import { create } from "zustand";
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

/** step 0 = Q0(직군/경력), step 1~8 = Q1~Q8 */
type Step = number;

type DiagnosisState = {
  // ── Q0 ──
  jobCategory: JobCategory | null;
  careerStage: CareerStage | null;

  // ── Q1~Q8 ──
  answers: Partial<DiagnosisAnswers>;

  // ── 결과 ──
  result: DiagnosisResult | null;

  // ── 네비게이션 ──
  step: Step; // 0 ~ 8
  totalSteps: number; // 9 (Q0 + Q1~Q8)

  // ── 액션 ──
  setQ0: (jobCategory: JobCategory, careerStage: CareerStage) => void;
  setAnswer: (questionId: QuestionId, optionId: OptionId) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;

  // ── 파생 ──
  canGoNext: () => boolean;
  isComplete: () => boolean;
  getQ0Answer: () => Q0Answer | null;
  getAnswers: () => DiagnosisAnswers | null;
};

const TOTAL_STEPS = 1 + QUESTION_IDS.length; // Q0 + Q1~Q8 = 9

export const useDiagnosisStore = create<DiagnosisState>((set, get) => ({
  jobCategory: null,
  careerStage: null,
  answers: {},
  result: null,
  step: 0,
  totalSteps: TOTAL_STEPS,

  setQ0: (jobCategory, careerStage) => set({ jobCategory, careerStage }),

  setAnswer: (questionId, optionId) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionId },
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
      result: null,
      step: 0,
    }),

  canGoNext: () => {
    const { step, jobCategory, careerStage, answers } = get();
    if (step === 0) return jobCategory !== null && careerStage !== null;
    const qId = QUESTION_IDS[step - 1];
    return qId !== undefined && answers[qId] !== undefined;
  },

  isComplete: () => {
    const { jobCategory, careerStage, answers } = get();
    if (!jobCategory || !careerStage) return false;
    return QUESTION_IDS.every((qId) => answers[qId] !== undefined);
  },

  getQ0Answer: () => {
    const { jobCategory, careerStage } = get();
    if (!jobCategory || !careerStage) return null;
    return { jobCategory, careerStage };
  },

  getAnswers: () => {
    const { answers } = get();
    const complete = QUESTION_IDS.every((qId) => answers[qId] !== undefined);
    return complete ? (answers as DiagnosisAnswers) : null;
  },
}));
