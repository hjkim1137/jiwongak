/**
 * 공고 분석 파이프라인 타입 정의
 *
 * 파이프라인: parsePosting → retrieveInsights → scoreDimensions → composeResult
 */

// ── 상수 ──

export const INDUSTRIES = [
  // IT/디지털
  "AI 응용", "DevTools", "커머스", "게임", "미디어/콘텐츠",
  "에듀테크", "모빌리티", "프롭테크", "HR테크", "SaaS",
  // 금융
  "은행", "증권", "보험", "자산운용", "카드/캐피탈", "핀테크", "가상자산/Web3",
  // 공공/정부
  "중앙정부(행정부처)", "지방정부", "공공기관(공기업/준정부기관)",
  "정부출연연구기관", "교육공공",
  // 전통/제조
  "제약/바이오", "의료기기", "자동차", "화학/소재", "반도체",
  "중공업", "전자", "건설", "식음료",
  // 서비스
  "광고/마케팅", "컨설팅", "통신", "유통/리테일",
  "교육(전통)", "의료서비스", "호텔/관광",
  // 기타
  "로봇", "SI/솔루션", "기타",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const JOB_CATEGORIES = [
  "기획·전략", "마케팅·홍보·조사", "회계·세무·재무", "인사·노무·HRD",
  "총무·법무·사무", "IT개발·데이터", "디자인", "영업·판매·무역",
  "고객상담·TM", "구매·자재·물류", "상품기획·MD", "운전·운송·배송",
  "서비스", "생산", "건설·건축", "의료", "연구·R&D", "교육",
  "미디어·문화·스포츠", "금융·보험", "공공·복지",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

// ── insight 관련 ──

export type InsightType =
  | "career_ceiling"
  | "lockin_risk"
  | "scarcity_value"
  | "transferability"
  | "growth_outlook"
  | "culture_pattern"
  | "compensation_pattern";

export type Severity = "info" | "warn" | "critical";

// ── 라이프스타일 타입 ──

export type LifestyleType =
  | "njob_lifer"
  | "growth_challenger"
  | "jumper"
  | "stable_wlb"
  | "founder_to_be"
  | "balanced";

// ── [1] parsePosting 결과 ──

export type ParsedPosting = {
  company: string;
  industry: Industry;
  sub_industry?: string;
  job_category: JobCategory;
  job_function: string;
  job_level_hint?: "core" | "minor" | null;
  requirements: {
    explicit: string[];
    implicit: string[];
    nice_to_have: string[];
  };
  raw_signals: {
    salary_mentioned?: number;
    wlb_keywords: string[];
    growth_keywords: string[];
    /**
     * 조직 속도/변화 빈도/디테일 강조 등 문화적 신호 키워드.
     * personality_fit 채점 근거로 사용. 추출 실패 시 빈 배열.
     */
    cultural_keywords: string[];
  };
};

// ── [2] retrieveInsights 결과 ──

export type RetrievedInsight = {
  id: string;
  slug: string;
  insight_type: InsightType;
  severity: Severity;
  title: string;
  content: string;
  similarity: number;
  specificity: number;
  final_score: number;
};

// ── [3] scoreDimensions 결과 ──

export type Dimension =
  | "skill_match"
  | "wlb"
  | "career_ceiling"
  | "personality_fit";

export type DimensionScore = {
  dimension: Dimension;
  score: number;
  confidence: number;
  evidence: string[];
  flags: string[];
};

// ── [4] composeResult 결과 ──

export type Label = "지원각" | "고민각" | "애매각" | "패스각" | "함정각";

export type AnalysisResult = {
  composite_score: number;
  label: Label;
  dimensions: DimensionScore[];
  cited_insights: RetrievedInsight[];
  warnings: string[];
  /** 분석에 사용된 프로필 요약 (비회원은 undefined) */
  lifestyle_type?: LifestyleType;
  job_category?: JobCategory;
  career_stage?: "entry" | "junior" | "senior";
};

// ── 사용자 프로필 (scoreDimensions 입력) ──

import type { PersonalityProfile } from "./personality";

export type UserProfile = {
  id: string;
  career_years?: number;
  /** Q0에서 선택한 경력 구간 (신입/주니어/시니어). 입력 폼 분기에 사용. */
  career_stage?: "entry" | "junior" | "senior";
  current_position?: string;
  lifestyle_type: LifestyleType;
  job_category?: JobCategory;
  summary_text?: string;
  skills: {
    name: string;
    category: string;
    level: number;
    years?: number;
    evidence?: string;
  }[];
  /**
   * 진단 P1~P6에서 계산된 성격 프로필.
   * 레거시 사용자(진단 미수행 또는 personality 단계 이전 진단)는 undefined →
   * scoreDimensions에서 personality_fit confidence를 0으로 강제.
   */
  personality_profile?: PersonalityProfile;
};
