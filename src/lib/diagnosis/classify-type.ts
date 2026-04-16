/**
 * classifyType — Q1~Q8 답변을 6타입(LifestyleType)으로 분류 + 가중치 프리셋 매핑
 *
 * 알고리즘:
 *  1) 각 문항의 선택된 옵션이 부여하는 타입별 점수를 누적
 *  2) balanced를 제외한 5타입 중 최고점 타입을 선택
 *  3) top1 - top2 gap이 `BALANCED_GAP_THRESHOLD` 미만이거나 모든 점수가 0이면 balanced로 귀속
 *  4) 결정된 타입의 dimension 가중치 프리셋(TYPE_WEIGHTS)을 반환 — compose-result와 공유
 */

import { TYPE_WEIGHTS } from "@/lib/analysis/compose-result";
import type { Dimension, LifestyleType } from "@/types/analysis";
import type {
  DiagnosisAnswers,
  DiagnosisResult,
  QuestionId,
} from "@/types/diagnosis";
import { QUESTIONS } from "./questions";

/**
 * top1/top2 점수 차이가 이 값 미만이면 balanced로 귀속.
 * 1로 설정하면 완전 동점(gap=0)만 balanced, gap=1 이상은 top1 타입으로 결정된다.
 */
const BALANCED_GAP_THRESHOLD = 1;

/** 분류 대상 타입 (balanced는 fallback이므로 비교 대상에서 제외) */
const CLASSIFIABLE_TYPES: readonly Exclude<LifestyleType, "balanced">[] = [
  "njob_lifer",
  "growth_challenger",
  "jumper",
  "stable_wlb",
  "founder_to_be",
];

function emptyScores(): Record<LifestyleType, number> {
  return {
    njob_lifer: 0,
    growth_challenger: 0,
    jumper: 0,
    stable_wlb: 0,
    founder_to_be: 0,
    balanced: 0,
  };
}

export function classifyType(answers: DiagnosisAnswers): DiagnosisResult {
  const scores = emptyScores();

  // 각 문항의 선택된 옵션 점수 벡터를 누적
  for (const question of QUESTIONS) {
    const choice = answers[question.id as QuestionId];
    const option = question.options.find((o) => o.id === choice);
    if (!option) continue; // 미답변이면 0점 기여
    for (const [type, delta] of Object.entries(option.scores) as [
      LifestyleType,
      number,
    ][]) {
      scores[type] += delta;
    }
  }

  // balanced 제외 타입 정렬
  const ranked = [...CLASSIFIABLE_TYPES]
    .map((t) => ({ type: t, score: scores[t] }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  const second = ranked[1];
  const topGap = top.score - (second?.score ?? 0);

  const lifestyleType: LifestyleType =
    top.score === 0 || topGap < BALANCED_GAP_THRESHOLD
      ? "balanced"
      : top.type;

  const weightsPreset = TYPE_WEIGHTS[lifestyleType] satisfies Record<
    Dimension,
    number
  >;

  return {
    lifestyleType,
    typeScores: scores,
    topGap,
    weightsPreset,
  };
}

/** UI/저장 레이어에서 별도 경로로 가중치 프리셋이 필요할 때 사용 */
export function getWeightsForType(
  type: LifestyleType,
): Record<Dimension, number> {
  return TYPE_WEIGHTS[type];
}
