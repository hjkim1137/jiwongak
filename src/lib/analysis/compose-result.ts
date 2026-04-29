/**
 * [4] composeResult — 가중평균 + 라벨 결정 + 함정각 오버라이드
 *
 * 순수 함수 (LLM 호출 없음). 테스트 용이.
 *
 * - 라이프스타일 타입별 가중치 프리셋 적용
 * - confidence 가중: 데이터 부족 dimension은 영향력 자동 감쇠
 * - critical severity 인사이트가 인용되면 함정각 오버라이드
 */

import type {
  DimensionScore,
  RetrievedInsight,
  AnalysisResult,
  UserProfile,
  Label,
  LifestyleType,
  Dimension,
} from "@/types/analysis";

/**
 * 라이프스타일 타입별 차원 가중치 프리셋. 합은 1.0이어야 한다 (테스트로 검증).
 *
 * personality_fit는 환경 격변 노출이 큰 타입(growth_challenger, founder_to_be)에
 * 비중을 더 두고, 안정형은 wlb 비중을 보존한다.
 */
export const TYPE_WEIGHTS: Record<LifestyleType, Record<Dimension, number>> = {
  njob_lifer:        { skill_match: 0.35, wlb: 0.30, career_ceiling: 0.15, personality_fit: 0.20 },
  growth_challenger: { skill_match: 0.30, wlb: 0.15, career_ceiling: 0.30, personality_fit: 0.25 },
  jumper:            { skill_match: 0.40, wlb: 0.10, career_ceiling: 0.30, personality_fit: 0.20 },
  stable_wlb:        { skill_match: 0.30, wlb: 0.40, career_ceiling: 0.10, personality_fit: 0.20 },
  founder_to_be:     { skill_match: 0.25, wlb: 0.15, career_ceiling: 0.30, personality_fit: 0.30 },
  balanced:          { skill_match: 0.30, wlb: 0.25, career_ceiling: 0.25, personality_fit: 0.20 },
};

function scoreToLabel(score: number): Label {
  if (score >= 80) return "지원각";
  if (score >= 60) return "고민각";
  if (score >= 40) return "애매각";
  return "패스각";
}

export function composeResult(
  scores: DimensionScore[],
  profile: UserProfile,
  insights: RetrievedInsight[],
): AnalysisResult {
  const weights = TYPE_WEIGHTS[profile.lifestyle_type];

  // 가중평균 (confidence도 가중치에 곱해서 신뢰 낮은 dimension은 영향 줄임)
  const weightedSum = scores.reduce(
    (sum, s) => sum + s.score * weights[s.dimension] * s.confidence,
    0,
  );
  const weightDenom = scores.reduce(
    (sum, s) => sum + weights[s.dimension] * s.confidence,
    0,
  );
  const composite = weightDenom > 0 ? weightedSum / weightDenom : 0;

  // 인용된 인사이트 추출 (evidence 또는 flags에서 slug 언급)
  const citedInsights = insights.filter((i) =>
    scores.some(
      (s) =>
        s.evidence.includes(i.slug) ||
        s.flags.some((f) => f.includes(i.slug)),
    ),
  );

  // 함정각 오버라이드: critical 인사이트가 인용된 경우
  const criticalCited = citedInsights.filter(
    (i) => i.severity === "critical",
  );

  const label: Label =
    criticalCited.length > 0 ? "함정각" : scoreToLabel(composite);

  return {
    composite_score: Math.round(composite),
    label,
    dimensions: scores,
    cited_insights: citedInsights,
    warnings: [
      ...criticalCited.map((i) => `⚫ ${i.title}: ${i.content}`),
      ...scores.flatMap((s) => s.flags),
    ],
  };
}
