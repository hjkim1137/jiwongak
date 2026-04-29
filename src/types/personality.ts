/**
 * 성격 분석(PersonalityProfile) 타입 정의
 *
 * LifestyleType과 직교하는 3축 양극 분류:
 *  - stress_tolerance: 스트레스 내성 (high=회복탄력성/페이스 유지, low=정비 시간 확보)
 *  - sensitivity: 민감도 (high=디테일/뉘앙스 감지, low=전체 흐름·핵심 우선)
 *  - change_adaptability: 변화 적응성 (high=새 환경 빠른 진입, low=한 환경 깊이 익숙)
 *
 * 톤 원칙(CLAUDE.md): 양극 모두 강점 프레임으로 라벨링.
 *   "민감도 low = 둔감"이 아니라 "전체 흐름 우선" 같은 비판단적 표현 사용.
 */

export const PERSONALITY_AXES = [
  "stress_tolerance",
  "sensitivity",
  "change_adaptability",
] as const;

export type PersonalityAxis = (typeof PERSONALITY_AXES)[number];

/** 각 축의 양극 + balanced fallback */
export type PersonalityPole = "high" | "low";
export type PersonalityClassification = PersonalityPole | "balanced";

/** P1~P6 — 축당 2문항 */
export const PERSONALITY_QUESTION_IDS = [
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
] as const;

export type PersonalityQuestionId = (typeof PERSONALITY_QUESTION_IDS)[number];

export type PersonalityOptionId = "A" | "B";

/**
 * 옵션이 한 축의 high/low 점수에 부여하는 가산치.
 * 한 옵션은 보통 한 축의 한 극에만 점수를 주지만, 구조상 여러 축 동시 가산도 허용.
 */
export type PersonalityScoreDelta = Partial<
  Record<PersonalityAxis, { high?: number; low?: number }>
>;

export type PersonalityQuestionOption = {
  id: PersonalityOptionId;
  label: string;
  scores: PersonalityScoreDelta;
};

export type PersonalityQuestion = {
  id: PersonalityQuestionId;
  /** 시그니처 축 (UI 헤더 태그용) */
  axis: PersonalityAxis;
  theme: string;
  prompt: string;
  options: [PersonalityQuestionOption, PersonalityQuestionOption];
};

export type PersonalityAnswers = Record<
  PersonalityQuestionId,
  PersonalityOptionId
>;

/**
 * 분류 결과.
 *  - axisScores: 축별 high/low 누적 점수 (디버깅/시각화용)
 *  - classification: 축별 분류 (high|low|balanced)
 */
export type PersonalityProfile = {
  axisScores: Record<PersonalityAxis, { high: number; low: number }>;
  classification: Record<PersonalityAxis, PersonalityClassification>;
};

// ── 메타 정보 (UI 표시용) ──

type AxisMeta = {
  /** 축 이름 (예: "스트레스 내성") */
  label: string;
  /** 축 한 줄 설명 */
  caption: string;
  /** high 라벨 (강점 프레임) */
  highLabel: string;
  /** low 라벨 (강점 프레임) */
  lowLabel: string;
  /** balanced 라벨 */
  balancedLabel: string;
  /** high/low/balanced 짧은 요약 */
  highSummary: string;
  lowSummary: string;
  balancedSummary: string;
  /** 양극 이모지 */
  highEmoji: string;
  lowEmoji: string;
  balancedEmoji: string;
};

export const PERSONALITY_AXIS_META: Record<PersonalityAxis, AxisMeta> = {
  stress_tolerance: {
    label: "스트레스 내성",
    caption: "압박·격무 상황에서의 회복 패턴",
    highLabel: "회복탄력 우위",
    lowLabel: "정비 우위",
    balancedLabel: "유연형",
    highSummary:
      "압박이 큰 시기에도 페이스를 유지하고, 다음 이슈로 비교적 빠르게 전환할 수 있는 성향",
    lowSummary:
      "고난도 작업 후 정비·회복 시간을 확보해 다음 단계의 품질을 끌어올리는 성향",
    balancedSummary:
      "상황에 따라 회복탄력과 정비 모드를 유연하게 선택하는 성향",
    highEmoji: "🛡️",
    lowEmoji: "🌱",
    balancedEmoji: "⚖️",
  },
  sensitivity: {
    label: "민감도",
    caption: "디테일·뉘앙스에 대한 감지 정도",
    highLabel: "디테일 감지 우위",
    lowLabel: "전체 흐름 우위",
    balancedLabel: "유연형",
    highSummary:
      "팀 분위기·산출물의 세부 결을 잘 알아차리고, 다듬어진 결과물에서 강점이 발휘되는 성향",
    lowSummary:
      "전체 흐름과 핵심 결과를 우선해 큰 그림을 빠르게 잡고 추진력 있게 진행하는 성향",
    balancedSummary:
      "디테일과 전체 흐름 사이를 상황에 따라 조율하는 성향",
    highEmoji: "🔍",
    lowEmoji: "🌊",
    balancedEmoji: "⚖️",
  },
  change_adaptability: {
    label: "변화 적응성",
    caption: "방향 전환·신규 환경 진입 패턴",
    highLabel: "전환 빠름",
    lowLabel: "깊이 익숙",
    balancedLabel: "유연형",
    highSummary:
      "직무·도구·도메인이 바뀌는 상황에서 학습 동기가 살아나고 새 방향에 빠르게 진입하는 성향",
    lowSummary:
      "한 환경에서 깊이 숙련도를 쌓아 도메인 전문성과 안정적 산출물에서 강점이 발휘되는 성향",
    balancedSummary:
      "변화와 안정 사이를 상황에 맞춰 조정하는 성향",
    highEmoji: "🔄",
    lowEmoji: "🧭",
    balancedEmoji: "⚖️",
  },
};
