import { render, screen } from "@testing-library/react";
import { AnalysisResultPreview } from "../analysis-result-preview";
import type { AnalysisResult } from "@/types/analysis";

const baseResult: AnalysisResult = {
  label: "고민각",
  composite_score: 71,
  dimensions: [
    { dimension: "skill_match",    score: 88, confidence: 1, evidence: [], flags: [] },
    { dimension: "wlb",            score: 45, confidence: 1, evidence: [], flags: [] },
    { dimension: "career_ceiling", score: 90, confidence: 1, evidence: [], flags: [] },
  ],
  cited_insights: [],
  warnings: [],
};

describe("AnalysisResultPreview", () => {
  it("라벨과 종합 점수가 렌더됨", () => {
    render(<AnalysisResultPreview result={baseResult} />);
    expect(screen.getByText("고민각")).toBeInTheDocument();
    expect(screen.getByText("71")).toBeInTheDocument();
  });

  it("dimension 점수가 모두 렌더됨", () => {
    render(<AnalysisResultPreview result={baseResult} />);
    expect(screen.getByText("스킬 매칭")).toBeInTheDocument();
    expect(screen.getByText("워라밸")).toBeInTheDocument();
    expect(screen.getByText("성장성")).toBeInTheDocument();
  });

  it("confidence=0 dimension은 스킬 미입력으로 표시", () => {
    const result: AnalysisResult = {
      ...baseResult,
      dimensions: [
        { dimension: "skill_match", score: 0, confidence: 0, evidence: [], flags: [] },
        { dimension: "wlb",            score: 80, confidence: 1, evidence: [], flags: [] },
        { dimension: "career_ceiling", score: 70, confidence: 1, evidence: [], flags: [] },
      ],
    };
    render(<AnalysisResultPreview result={result} />);
    expect(screen.getByText("— 스킬 미입력")).toBeInTheDocument();
    expect(screen.getByText("스킬 매칭 점수가 빠져있어요")).toBeInTheDocument();
  });

  it("함정각 라벨은 위험 요인 섹션 없이 렌더됨 (경고 없으면)", () => {
    const result: AnalysisResult = { ...baseResult, label: "함정각", composite_score: 85, warnings: [] };
    render(<AnalysisResultPreview result={result} />);
    expect(screen.getByText("함정각")).toBeInTheDocument();
    expect(screen.queryByText("⚠ 주요 위험 요인")).not.toBeInTheDocument();
  });

  it("⚫ 경고가 있으면 주요 위험 요인 섹션이 렌더됨", () => {
    const result: AnalysisResult = {
      ...baseResult,
      label: "함정각",
      warnings: ["⚫ 위험 인사이트: 이 포지션은 비코어 직군입니다"],
    };
    render(<AnalysisResultPreview result={result} />);
    expect(screen.getByText("⚠ 주요 위험 요인")).toBeInTheDocument();
    expect(screen.getByText(/비코어 직군/)).toBeInTheDocument();
  });

  it("참고사항 경고는 참고사항 섹션에 렌더됨", () => {
    const result: AnalysisResult = {
      ...baseResult,
      warnings: ["야근 빈도가 높을 수 있습니다"],
    };
    render(<AnalysisResultPreview result={result} />);
    expect(screen.getByText("참고사항")).toBeInTheDocument();
    expect(screen.getByText(/야근 빈도/)).toBeInTheDocument();
  });

  it("인용 인사이트가 있으면 이 분석의 근거 섹션 렌더됨", () => {
    const result: AnalysisResult = {
      ...baseResult,
      cited_insights: [{
        id: "test-insight",
        slug: "test-insight",
        insight_type: "career_ceiling",
        severity: "warn",
        title: "테스트 인사이트",
        content: "인사이트 내용",
        similarity: 0.9,
        specificity: 1.0,
        final_score: 0.9,
      }],
    };
    render(<AnalysisResultPreview result={result} />);
    expect(screen.getByText("이 분석의 근거")).toBeInTheDocument();
    expect(screen.getByText("테스트 인사이트")).toBeInTheDocument();
    expect(screen.getByText("인사이트 내용")).toBeInTheDocument();
  });

  it("스냅샷 — 기본 고민각 결과", () => {
    const { container } = render(<AnalysisResultPreview result={baseResult} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("스냅샷 — 함정각 (⚫ 경고 포함)", () => {
    const result: AnalysisResult = {
      ...baseResult,
      label: "함정각",
      composite_score: 75,
      warnings: ["⚫ 위험 신호: 비코어 직군입니다"],
    };
    const { container } = render(<AnalysisResultPreview result={result} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
