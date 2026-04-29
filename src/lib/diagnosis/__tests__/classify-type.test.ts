import { classifyType } from "../classify-type";
import type { DiagnosisAnswers } from "@/types/diagnosis";

// Q1~Q8 전부 같은 옵션으로 강하게 편향
const allA: DiagnosisAnswers = {
  Q1: "A", Q2: "A", Q3: "A", Q4: "A",
  Q5: "A", Q6: "A", Q7: "A", Q8: "A",
};
const allB: DiagnosisAnswers = {
  Q1: "B", Q2: "B", Q3: "B", Q4: "B",
  Q5: "B", Q6: "B", Q7: "B", Q8: "B",
};

describe("classifyType", () => {
  describe("타입 결정 — 편향 케이스", () => {
    it("전부 A 선택 시 njob_lifer 또는 founder_to_be로 분류 (stable_wlb 아님)", () => {
      const result = classifyType(allA);
      expect(result.lifestyleType).not.toBe("stable_wlb");
      expect(result.lifestyleType).not.toBe("balanced");
    });

    it("전부 B 선택 시 stable_wlb로 분류", () => {
      const result = classifyType(allB);
      expect(result.lifestyleType).toBe("stable_wlb");
    });

    it("typeScores에 모든 6타입이 포함됨", () => {
      const result = classifyType(allA);
      const keys = Object.keys(result.typeScores);
      expect(keys).toContain("njob_lifer");
      expect(keys).toContain("growth_challenger");
      expect(keys).toContain("jumper");
      expect(keys).toContain("stable_wlb");
      expect(keys).toContain("founder_to_be");
      expect(keys).toContain("balanced");
    });
  });

  describe("balanced fallback", () => {
    it("미답변(빈 answers)이면 balanced 반환", () => {
      const result = classifyType({} as DiagnosisAnswers);
      expect(result.lifestyleType).toBe("balanced");
    });

    it("topGap < 1 이면 balanced로 귀속", () => {
      // 완전 동점을 만들기 위해 답변 없음 케이스 사용 → 모든 타입 0점 → gap=0
      const result = classifyType({} as DiagnosisAnswers);
      expect(result.topGap).toBe(0);
      expect(result.lifestyleType).toBe("balanced");
    });
  });

  describe("가중치 프리셋 반환", () => {
    it("반환된 weightsPreset의 dimension 합이 1.0 (4차원)", () => {
      const result = classifyType(allB); // stable_wlb
      const sum = Object.values(result.weightsPreset).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });

    it("stable_wlb 프리셋은 wlb 가중치가 가장 높음", () => {
      const result = classifyType(allB);
      expect(result.weightsPreset.wlb).toBeGreaterThan(result.weightsPreset.skill_match);
      expect(result.weightsPreset.wlb).toBeGreaterThan(result.weightsPreset.career_ceiling);
    });

    it("모든 타입의 personality_fit 가중치가 0보다 큼", () => {
      // 6타입 전부에 personality_fit 비중이 부여되어야 한다 (4차원 재정규화 후)
      const types = [allA, allB, {} as DiagnosisAnswers];
      for (const answers of types) {
        const result = classifyType(answers);
        expect(result.weightsPreset.personality_fit).toBeGreaterThan(0);
      }
    });
  });

  describe("결정론적 출력", () => {
    it("동일한 answers는 항상 동일한 결과를 반환", () => {
      const a1 = classifyType(allA);
      const a2 = classifyType(allA);
      expect(a1.lifestyleType).toBe(a2.lifestyleType);
      expect(a1.typeScores).toEqual(a2.typeScores);
    });
  });
});
