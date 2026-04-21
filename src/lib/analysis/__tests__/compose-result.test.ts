import { composeResult } from "../compose-result";
import type {
  DimensionScore,
  RetrievedInsight,
  UserProfile,
} from "@/types/analysis";

const makeScore = (
  dimension: DimensionScore["dimension"],
  score: number,
  confidence = 1,
  overrides: Partial<DimensionScore> = {},
): DimensionScore => ({
  dimension,
  score,
  confidence,
  evidence: [],
  flags: [],
  ...overrides,
});

const makeInsight = (
  severity: RetrievedInsight["severity"],
  slug: string,
  overrides: Partial<RetrievedInsight> = {},
): RetrievedInsight => ({
  id: slug,
  slug,
  insight_type: "career_ceiling",
  severity,
  title: slug,
  content: "테스트 인사이트",
  similarity: 0.9,
  specificity: 1.0,
  final_score: 0.9,
  ...overrides,
});

const baseProfile: UserProfile = {
  id: "test",
  lifestyle_type: "njob_lifer",
  skills: [],
};

describe("composeResult", () => {
  describe("라벨 결정 — 점수 기반", () => {
    it("composite >= 80 → 지원각", () => {
      const scores = [
        makeScore("skill_match", 82),
        makeScore("wlb", 88),
        makeScore("career_ceiling", 72),
      ];
      const result = composeResult(scores, baseProfile, []);
      expect(result.label).toBe("지원각");
    });

    it("composite 60~79 → 고민각", () => {
      // njob_lifer weights: skill=0.4, wlb=0.4, ceiling=0.2
      // composite = 80×0.4 + 70×0.4 + 60×0.2 = 32+28+12 = 72 → 고민각
      const scores = [
        makeScore("skill_match", 80),
        makeScore("wlb", 70),
        makeScore("career_ceiling", 60),
      ];
      const result = composeResult(scores, baseProfile, []);
      expect(result.label).toBe("고민각");
    });

    it("composite 40~59 → 애매각", () => {
      const scores = [
        makeScore("skill_match", 45),
        makeScore("wlb", 40),
        makeScore("career_ceiling", 40),
      ];
      const result = composeResult(scores, baseProfile, []);
      expect(result.label).toBe("애매각");
    });

    it("composite < 40 → 패스각", () => {
      const scores = [
        makeScore("skill_match", 10),
        makeScore("wlb", 20),
        makeScore("career_ceiling", 10),
      ];
      const result = composeResult(scores, baseProfile, []);
      expect(result.label).toBe("패스각");
    });
  });

  describe("함정각 오버라이드", () => {
    it("critical 인사이트가 인용되면 점수 무관하게 함정각", () => {
      const criticalSlug = "danger-insight";
      const scores = [
        makeScore("skill_match", 90, 1, { evidence: [criticalSlug] }),
        makeScore("wlb", 90),
        makeScore("career_ceiling", 90),
      ];
      const insights = [makeInsight("critical", criticalSlug)];
      const result = composeResult(scores, baseProfile, insights);
      expect(result.label).toBe("함정각");
      expect(result.composite_score).toBeGreaterThanOrEqual(80); // 점수 자체는 높음
    });

    it("warn 인사이트는 함정각 오버라이드 없음", () => {
      const warnSlug = "warn-insight";
      const scores = [
        makeScore("skill_match", 90, 1, { evidence: [warnSlug] }),
        makeScore("wlb", 90),
        makeScore("career_ceiling", 90),
      ];
      const insights = [makeInsight("warn", warnSlug)];
      const result = composeResult(scores, baseProfile, insights);
      expect(result.label).toBe("지원각");
    });

    it("critical 인사이트가 있어도 인용 안 되면 오버라이드 없음", () => {
      const scores = [
        makeScore("skill_match", 30),
        makeScore("wlb", 30),
        makeScore("career_ceiling", 30),
      ];
      const insights = [makeInsight("critical", "not-cited-slug")];
      const result = composeResult(scores, baseProfile, insights);
      expect(result.label).toBe("패스각");
    });
  });

  describe("confidence 가중 평균", () => {
    it("confidence=0 인 dimension은 가중평균에 기여 0", () => {
      // njob_lifer: skill=0.4, wlb=0.4, ceiling=0.2
      // career_ceiling confidence=0 → 실질 가중치 0
      // 유효: skill=0.4×1, wlb=0.4×1 → 정규화: skill 50%, wlb 50%
      const scores = [
        makeScore("skill_match", 100, 1),
        makeScore("wlb", 0, 1),
        makeScore("career_ceiling", 0, 0),
      ];
      const result = composeResult(scores, baseProfile, []);
      // career_ceiling 제외 → (100×0.4 + 0×0.4) / (0.4+0.4) = 40/0.8 = 50
      expect(result.composite_score).toBe(50);
    });

    it("라이프스타일별 가중치 프리셋 적용 확인 — growth_challenger", () => {
      // growth_challenger: skill=0.4, wlb=0.2, ceiling=0.4
      const profile: UserProfile = { ...baseProfile, lifestyle_type: "growth_challenger" };
      const scores = [
        makeScore("skill_match", 100),
        makeScore("wlb", 0),
        makeScore("career_ceiling", 0),
      ];
      const result = composeResult(scores, profile, []);
      // (100×0.4 + 0×0.2 + 0×0.4) / (0.4+0.2+0.4) = 40/1.0 = 40
      expect(result.composite_score).toBe(40);
    });
  });

  describe("warnings 생성", () => {
    it("critical 인용 인사이트가 warnings 앞부분에 ⚫ 포함", () => {
      const slug = "critical-slug";
      const scores = [makeScore("skill_match", 50, 1, { evidence: [slug] }), makeScore("wlb", 50), makeScore("career_ceiling", 50)];
      const insights = [makeInsight("critical", slug, { title: "위험 요인", content: "위험 내용" })];
      const result = composeResult(scores, baseProfile, insights);
      expect(result.warnings.some((w) => w.startsWith("⚫"))).toBe(true);
    });

    it("dimension flags가 warnings에 포함", () => {
      const scores = [
        makeScore("skill_match", 50, 1, { flags: ["테스트 경고"] }),
        makeScore("wlb", 50),
        makeScore("career_ceiling", 50),
      ];
      const result = composeResult(scores, baseProfile, []);
      expect(result.warnings).toContain("테스트 경고");
    });
  });
});
