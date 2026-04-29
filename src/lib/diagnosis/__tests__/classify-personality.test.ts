import { classifyPersonality } from "../classify-personality";
import type { PersonalityAnswers } from "@/types/personality";

const allA: PersonalityAnswers = {
  P1: "A", P2: "A", P3: "A", P4: "A", P5: "A", P6: "A",
};
const allB: PersonalityAnswers = {
  P1: "B", P2: "B", P3: "B", P4: "B", P5: "B", P6: "B",
};

describe("classifyPersonality", () => {
  describe("편향 케이스", () => {
    it("전부 A 선택 시 3축 모두 high", () => {
      const result = classifyPersonality(allA);
      expect(result.classification.stress_tolerance).toBe("high");
      expect(result.classification.sensitivity).toBe("high");
      expect(result.classification.change_adaptability).toBe("high");
    });

    it("전부 B 선택 시 3축 모두 low", () => {
      const result = classifyPersonality(allB);
      expect(result.classification.stress_tolerance).toBe("low");
      expect(result.classification.sensitivity).toBe("low");
      expect(result.classification.change_adaptability).toBe("low");
    });

    it("축당 high/low 점수 합 = 옵션 가산치 합", () => {
      const result = classifyPersonality(allA);
      // P1A=high+2, P2A=high+2 → stress high=4
      expect(result.axisScores.stress_tolerance.high).toBe(4);
      expect(result.axisScores.stress_tolerance.low).toBe(0);
      expect(result.axisScores.sensitivity.high).toBe(4);
      expect(result.axisScores.change_adaptability.high).toBe(4);
    });
  });

  describe("balanced fallback", () => {
    it("미답변(빈 객체)이면 3축 모두 balanced", () => {
      const result = classifyPersonality({});
      expect(result.classification.stress_tolerance).toBe("balanced");
      expect(result.classification.sensitivity).toBe("balanced");
      expect(result.classification.change_adaptability).toBe("balanced");
    });

    it("축 안에서 동점(P1=A, P2=B) → 해당 축만 balanced", () => {
      const answers: PersonalityAnswers = {
        P1: "A", P2: "B", // stress: high=2, low=2 → balanced
        P3: "A", P4: "A", // sensitivity: high=4 → high
        P5: "B", P6: "B", // change: low=4 → low
      };
      const result = classifyPersonality(answers);
      expect(result.classification.stress_tolerance).toBe("balanced");
      expect(result.classification.sensitivity).toBe("high");
      expect(result.classification.change_adaptability).toBe("low");
    });

    it("일부 축만 답변하면 답변한 축만 분류, 나머지는 balanced", () => {
      const partial: Partial<PersonalityAnswers> = {
        P1: "A", P2: "A", // stress only
      };
      const result = classifyPersonality(partial);
      expect(result.classification.stress_tolerance).toBe("high");
      expect(result.classification.sensitivity).toBe("balanced");
      expect(result.classification.change_adaptability).toBe("balanced");
    });
  });

  describe("결정론적 출력", () => {
    it("동일한 answers는 항상 동일한 결과를 반환", () => {
      const r1 = classifyPersonality(allA);
      const r2 = classifyPersonality(allA);
      expect(r1.classification).toEqual(r2.classification);
      expect(r1.axisScores).toEqual(r2.axisScores);
    });
  });
});
