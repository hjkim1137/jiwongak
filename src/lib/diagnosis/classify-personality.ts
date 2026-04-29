/**
 * classifyPersonality — P1~P6 답변을 3축 양극 분류로 변환
 *
 * 알고리즘:
 *  1) 각 문항의 선택된 옵션이 부여하는 축별 high/low 점수를 누적
 *  2) 축별 pole = high - low
 *  3) |pole| < BALANCED_GAP_THRESHOLD 이면 "balanced", 아니면 "high"|"low"
 *  4) 미답변(전체 또는 일부) → 해당 축 점수 0 → balanced로 귀속
 *
 * 결정성: 같은 입력 → 같은 출력 (테스트 보장).
 */

import {
  PERSONALITY_AXES,
  type PersonalityAnswers,
  type PersonalityAxis,
  type PersonalityClassification,
  type PersonalityProfile,
} from "@/types/personality";
import { PERSONALITY_QUESTIONS } from "./personality-questions";

/**
 * |high - low|가 이 값 미만이면 balanced로 귀속.
 * 1로 두면 완전 동점만 balanced. 축당 2문항 × 2점 = 한쪽 극에만 골랐을 때 4점차이가 나므로,
 * 한 쪽이라도 비균질 답변이면 high/low로 결정된다.
 */
const BALANCED_GAP_THRESHOLD = 1;

function emptyAxisScores(): Record<
  PersonalityAxis,
  { high: number; low: number }
> {
  return {
    stress_tolerance: { high: 0, low: 0 },
    sensitivity: { high: 0, low: 0 },
    change_adaptability: { high: 0, low: 0 },
  };
}

export function classifyPersonality(
  answers: Partial<PersonalityAnswers>,
): PersonalityProfile {
  const axisScores = emptyAxisScores();

  for (const question of PERSONALITY_QUESTIONS) {
    const choice = answers[question.id];
    if (!choice) continue;
    const option = question.options.find((o) => o.id === choice);
    if (!option) continue;
    for (const [axis, delta] of Object.entries(option.scores) as [
      PersonalityAxis,
      { high?: number; low?: number },
    ][]) {
      if (delta.high) axisScores[axis].high += delta.high;
      if (delta.low) axisScores[axis].low += delta.low;
    }
  }

  const classification = {} as Record<
    PersonalityAxis,
    PersonalityClassification
  >;
  for (const axis of PERSONALITY_AXES) {
    const { high, low } = axisScores[axis];
    const pole = high - low;
    if (Math.abs(pole) < BALANCED_GAP_THRESHOLD) {
      classification[axis] = "balanced";
    } else {
      classification[axis] = pole > 0 ? "high" : "low";
    }
  }

  return { axisScores, classification };
}
