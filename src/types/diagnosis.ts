/**
 * 진단(Diagnosis) 타입 정의
 *
 * 플로우: Q0(직군 + 경력 구간) → Q1~Q8(양자택일) → classifyType → LifestyleType + 가중치 프리셋
 *
 * - LifestyleType 자체는 `analysis.ts`에 정의되어 있음 (compose-result에서도 사용)
 * - 여기서는 진단 입력/출력 타입과 문항 구조만 정의
 */

import type { JobCategory, LifestyleType } from "./analysis";
import type {
  PersonalityAnswers,
  PersonalityProfile,
} from "./personality";

// ── 경력 구간 ──

export const CAREER_STAGES = ["entry", "junior", "senior"] as const;

export type CareerStage = (typeof CAREER_STAGES)[number];

/**
 * 경력 구간 ↔ 연차 매핑.
 * - entry:  신입 (0년) — 프로젝트/자격증/교육 위주 입력
 * - junior: 1~3년차 — 실무 경험 + 스킬
 * - senior: 4년+ — 실무 경험 + 스킬 + 리더십/도메인 깊이
 */
export const CAREER_STAGE_META: Record<
  CareerStage,
  {
    label: string;
    short: string;
    yearsRange: [number, number | null]; // null = upper bound 없음
    inputFocus: "projects_certs_edu" | "skills_experience";
  }
> = {
  entry: {
    label: "신입 (0년)",
    short: "신입",
    yearsRange: [0, 0],
    inputFocus: "projects_certs_edu",
  },
  junior: {
    label: "주니어 (1~3년차)",
    short: "주니어",
    yearsRange: [1, 3],
    inputFocus: "skills_experience",
  },
  senior: {
    label: "시니어 (4년차 이상)",
    short: "시니어",
    yearsRange: [4, null],
    inputFocus: "skills_experience",
  },
};

// ── 문항 구조 ──

/** Q1~Q8 문항 ID (Q0는 별도로 직군/경력 구간 선택이라 여기 없음) */
export const QUESTION_IDS = [
  "Q1",
  "Q2",
  "Q3",
  "Q4",
  "Q5",
  "Q6",
  "Q7",
  "Q8",
] as const;

export type QuestionId = (typeof QUESTION_IDS)[number];

export type OptionId = "A" | "B";

/** 각 선택지가 6타입에 기여하는 점수 (없는 타입은 0) */
export type TypeScoreDelta = Partial<Record<LifestyleType, number>>;

export type QuestionOption = {
  id: OptionId;
  label: string;
  /** 보조 설명 (미선택 시에는 숨김 가능) */
  description?: string;
  scores: TypeScoreDelta;
};

export type Question = {
  id: QuestionId;
  /** 질문 프롬프트 */
  prompt: string;
  /** 진단 주제 (UI 상단 태그 등에 사용) */
  theme: string;
  options: [QuestionOption, QuestionOption];
};

// ── 진단 입력/결과 ──

/** Q0: 직군 + 경력 구간 (드롭다운/버튼에서 선택) */
export type Q0Answer = {
  jobCategory: JobCategory;
  careerStage: CareerStage;
};

/** Q1~Q8: 문항별 선택 (A | B) */
export type DiagnosisAnswers = Record<QuestionId, OptionId>;

export type DiagnosisInput = {
  q0: Q0Answer;
  answers: DiagnosisAnswers;
  personalityAnswers: PersonalityAnswers;
};

export type DiagnosisResult = {
  lifestyleType: LifestyleType;
  /** 6타입별 누적 점수 (디버깅/시각화용) */
  typeScores: Record<LifestyleType, number>;
  /** top1 - top2 점수차 (낮으면 balanced로 귀속) */
  topGap: number;
  /**
   * compose-result에서 사용할 dimension 가중치 프리셋.
   * personality_fit 도입으로 4차원, 합 1.0.
   */
  weightsPreset: Record<
    "skill_match" | "wlb" | "career_ceiling" | "personality_fit",
    number
  >;
  /**
   * P1~P6에서 계산된 성격 분류 + 축별 점수.
   * classify-type은 라이프스타일만 채우고 page.tsx handleComplete에서
   * classify-personality 결과를 머지한다.
   * 레거시 호출(personality 미수행)에 대비해 옵셔널.
   */
  personality?: PersonalityProfile;
};

// ── 라이프스타일 타입 메타 ──

/**
 * 6타입의 한국어 라벨/이모지/짧은 설명.
 * UI(결과 카드, 태그)에서 공통 사용.
 *
 * 톤: CLAUDE.md 지침대로 `N잡/부업` 같은 민감 표현은 순화 톤 유지.
 */
export const LIFESTYLE_TYPE_META: Record<
  LifestyleType,
  { emoji: string; label: string; summary: string }
> = {
  njob_lifer: {
    emoji: "🌙",
    label: "워라밸+사이드 양립형",
    summary:
      "본업은 안정적으로 유지하면서, 업무 외 시간에 사이드 프로젝트·학습·수익원 다각화를 추구하는 성향",
  },
  growth_challenger: {
    emoji: "🚀",
    label: "성장형 도전자",
    summary:
      "빠르게 움직이는 조직에서 도전적인 과제로 커리어 성장 속도를 최대화하려는 성향",
  },
  jumper: {
    emoji: "🏃",
    label: "이직 점프형",
    summary:
      "2~3년 주기로 조직을 옮기며 직급·보상·경험을 단계적으로 업그레이드하는 성향",
  },
  stable_wlb: {
    emoji: "🏡",
    label: "안정·WLB 중시",
    summary:
      "예측 가능한 업무량·장기 고용·삶의 질을 조직 선택의 최우선 기준으로 두는 성향",
  },
  founder_to_be: {
    emoji: "🔥",
    label: "창업 지향",
    summary:
      "창업/C레벨 커리어를 중장기 목표로 두고, 제품·사업 전반의 의사결정 권한을 중요시하는 성향",
  },
  balanced: {
    emoji: "⚖️",
    label: "균형형",
    summary:
      "특정 방향에 강하게 치우치지 않고, 상황에 따라 유연하게 판단하는 성향",
  },
};
