import type { AnalysisResult } from "@/types/analysis";

export interface DemoPosting {
  companyType: string;
  position: string;
  postingCategory: string;
  scenario: string;
  result: AnalysisResult;
}

export const DEMO_POSTINGS: DemoPosting[] = [
  // ─── 1. 지원각 (IT개발·데이터) ────────────────────────────────────────────────
  {
    companyType: "국내 AI B2B SaaS 스타트업",
    position: "프론트엔드 개발자",
    postingCategory: "IT개발·데이터",
    scenario: "스킬·성장성·워라밸 모두 우수한 케이스",
    result: {
      composite_score: 83,
      label: "지원각",
      lifestyle_type: "njob_lifer",
      job_category: "IT개발·데이터",
      career_stage: "junior",
      dimensions: [
        { dimension: "skill_match",    score: 88, confidence: 0.9,  evidence: ["React", "TypeScript", "Next.js", "Claude API"], flags: [] },
        { dimension: "wlb",           score: 82, confidence: 0.8,  evidence: ["ai-app-b2b-saas-wlb"],  flags: [] },
        { dimension: "career_ceiling", score: 75, confidence: 0.85, evidence: ["ai-app-saas-frontend-scarcity"], flags: [] },
      ],
      cited_insights: [
        {
          id: "ai-app-saas-frontend-scarcity",
          slug: "ai-app-saas-frontend-scarcity",
          insight_type: "scarcity_value",
          severity: "info",
          title: "AI 제품 프론트는 시장 희소",
          content: "AI Application 분야는 2024~2025년 형성된 신생 시장. 5년차 이상 베테랑이 거의 없어 경력 2~3년차도 진입 가능. AI 제품의 스트리밍 UX, RAG UI, Tool Use 결과 표시 등을 다룰 줄 아는 프론트엔드는 공급보다 수요가 큼. 같은 직무여도 일반 SaaS보다 희소가치가 높음.",
          similarity: 0.88, specificity: 1.0, final_score: 0.88,
        },
        {
          id: "ai-app-b2b-saas-wlb",
          slug: "ai-app-b2b-saas-wlb",
          insight_type: "growth_outlook",
          severity: "info",
          title: "B2B SaaS는 야근 적고 안정적",
          content: "B2C AI 서비스와 달리 B2B SaaS는 트래픽 폭증·24시간 대응 부담이 작아 WLB가 비교적 안정. 단 사내 실험 조직이나 신사업 본부는 예외로 강도가 높을 수 있음.",
          similarity: 0.82, specificity: 0.85, final_score: 0.70,
        },
      ],
      warnings: [],
    },
  },

  // ─── 2. 고민각 (기획·전략) ────────────────────────────────────────────────────
  {
    companyType: "AI 스타트업",
    position: "서비스 기획자",
    postingCategory: "기획·전략",
    scenario: "WLB 우수, 기술 이해도 인정, 개발 커리어 이탈 우려",
    result: {
      composite_score: 61,
      label: "고민각",
      lifestyle_type: "njob_lifer",
      job_category: "IT개발·데이터",
      career_stage: "junior",
      dimensions: [
        { dimension: "skill_match",    score: 50, confidence: 0.75, evidence: ["기술 배경 — API 이해, 요구사항 작성 가능"], flags: [] },
        { dimension: "wlb",           score: 85, confidence: 0.8,  evidence: ["유연근무", "자율 연차"], flags: [] },
        { dimension: "career_ceiling", score: 35, confidence: 0.8,  evidence: ["strategy-data-driven-trend"], flags: ["개발 커리어에서 기획 트랙으로의 전환 — 이후 개발직 복귀 어려울 수 있음"] },
      ],
      cited_insights: [
        {
          id: "strategy-data-driven-trend",
          slug: "strategy-data-driven-trend",
          insight_type: "growth_outlook",
          severity: "info",
          title: "데이터 기반 기획 역량 수요 증가",
          content: "경영기획·사업기획 직군에서 데이터 분석 역량(SQL, BI 도구) 보유자 우대 경향 강화. 감에 의한 기획에서 데이터 기반 기획으로 전환 중. 데이터 분석 + 기획 조합은 시장 희소성 높음.",
          similarity: 0.76, specificity: 0.5, final_score: 0.38,
        },
      ],
      warnings: ["개발 커리어에서 기획 트랙으로의 전환 — 이후 개발직 복귀 어려울 수 있음"],
    },
  },

  // ─── 3. 애매각 (영업·판매·무역) ──────────────────────────────────────────────
  {
    companyType: "B2B SaaS 기업",
    position: "기술영업 (Technical Sales)",
    postingCategory: "영업·판매·무역",
    scenario: "기술 배경이 일부 도움되나 영업 전문성 미흡, 커리어 이탈 위험",
    result: {
      composite_score: 42,
      label: "애매각",
      lifestyle_type: "njob_lifer",
      job_category: "IT개발·데이터",
      career_stage: "junior",
      dimensions: [
        { dimension: "skill_match",    score: 35, confidence: 0.85, evidence: ["제품 데모 가능", "API 이해도"], flags: [] },
        { dimension: "wlb",           score: 62, confidence: 0.6,  evidence: [], flags: ["고객사 미팅·출장 빈도에 따라 WLB 편차 큼"] },
        { dimension: "career_ceiling", score: 15, confidence: 0.88, evidence: ["b2b-sales-career-ceiling-no-pm"], flags: ["영업 트랙 고착 위험 — 비영업 직군 전환 시 실무 경험 부족"] },
      ],
      cited_insights: [
        {
          id: "b2b-sales-career-ceiling-no-pm",
          slug: "b2b-sales-career-ceiling-no-pm",
          insight_type: "career_ceiling",
          severity: "warn",
          title: "영업직은 관리직 외 커리어 확장 경로가 제한적",
          content: "B2B 영업 경력은 팀장/본부장 등 관리 트랙이 전형적인 성장 경로. 비영업 직군(기획, PM, 마케팅)으로의 전환은 실무 경험 부족으로 어려운 경우가 많음. 단 사업개발(BD), 파트너십, 영업기획 등 하이브리드 직군으로의 전환은 비교적 용이. 대고객 경험을 비즈니스 역량으로 어필할 수 있는 직군을 커리어 목표로 설정하는 것이 유리.",
          similarity: 0.74, specificity: 0.5, final_score: 0.37,
        },
        {
          id: "b2b-sales-domain-expertise-premium",
          slug: "b2b-sales-domain-expertise-premium",
          insight_type: "scarcity_value",
          severity: "info",
          title: "B2B 영업은 도메인 전문성이 연봉 프리미엄 결정",
          content: "B2B 영업직은 단순 세일즈 스킬보다 담당 도메인(IT솔루션, 제조, 금융, 의료 등) 전문 지식이 고객 신뢰와 딜 사이즈를 결정하는 경향. 도메인 이해도가 낮으면 제품 시연·제안서 수준이 낮아 성과 차이가 명확히 발생. 엔터프라이즈 대상 SaaS, ERP, 클라우드 솔루션 등 복잡한 제품군 영업 경력은 높은 시장 이동성을 가짐.",
          similarity: 0.70, specificity: 0.5, final_score: 0.35,
        },
      ],
      warnings: [
        "고객사 미팅·출장 빈도에 따라 WLB 편차 큼",
        "영업 트랙 고착 위험 — 비영업 직군 전환 시 실무 경험 부족",
      ],
    },
  },

  // ─── 4. 패스각 (마케팅·홍보·조사) ───────────────────────────────────────────
  {
    companyType: "소비재 스타트업",
    position: "퍼포먼스 마케터",
    postingCategory: "마케팅·홍보·조사",
    scenario: "직군 완전 미스매칭 — 스킬 전이 없음",
    result: {
      composite_score: 30,
      label: "패스각",
      lifestyle_type: "njob_lifer",
      job_category: "IT개발·데이터",
      career_stage: "junior",
      dimensions: [
        { dimension: "skill_match",    score: 8,  confidence: 0.9,  evidence: [], flags: [] },
        { dimension: "wlb",           score: 65, confidence: 0.65, evidence: ["시차출근", "연차 자유"],  flags: [] },
        { dimension: "career_ceiling", score: 5,  confidence: 0.92, evidence: [],  flags: [] },
      ],
      cited_insights: [
        {
          id: "marketing-performance-demand",
          slug: "marketing-performance-demand",
          insight_type: "scarcity_value",
          severity: "info",
          title: "퍼포먼스 마케팅 전문가 수요 높음",
          content: "디지털 광고 시장 성장으로 퍼포먼스 마케팅(Google Ads, Meta Ads, 그로스해킹) 전문가 수요 지속 증가. ROAS/CPA 기반 성과 측정이 가능해 연봉 협상력이 높은 편. 단 플랫폼 정책 변경(쿠키 제한 등)에 따라 역량 갱신이 필요.",
          similarity: 0.71, specificity: 0.5, final_score: 0.36,
        },
      ],
      warnings: [],
    },
  },

  // ─── 5. 함정각 (기획·전략) ────────────────────────────────────────────────────
  {
    companyType: "AI 솔루션 위장 SI 기업",
    position: "서비스 기획 PM",
    postingCategory: "기획·전략",
    scenario: "점수는 고민각 수준이나 치명적 업계 경고로 함정각 판정",
    result: {
      composite_score: 60,
      label: "함정각",
      lifestyle_type: "njob_lifer",
      job_category: "IT개발·데이터",
      career_stage: "junior",
      dimensions: [
        { dimension: "skill_match",    score: 62, confidence: 0.8,  evidence: ["기술 배경 — 개발팀 소통, 요구사항 분석"], flags: [] },
        { dimension: "wlb",           score: 76, confidence: 0.7,  evidence: ["유연근무", "자율 출퇴근"], flags: [] },
        { dimension: "career_ceiling", score: 26, confidence: 0.75, evidence: ["si-solution-disguised-as-ai"], flags: ["SI 납품 구조 특성상 실질적 커리어 전이성 낮음"] },
      ],
      cited_insights: [
        {
          id: "si-solution-disguised-as-ai",
          slug: "si-solution-disguised-as-ai",
          insight_type: "lockin_risk",
          severity: "critical",
          title: "AI 라벨 있어도 SI는 SI",
          content: "AI/Big Data/통신 OSS 솔루션 회사는 자사 제품 회사와 다르게 평가됨. 고객사 파견·정부 R&D 과제로 근무지 유동, 문서 산출물 다수, 이력서에 'AI 솔루션 개발'로 인식되어 'AI 제품 개발' 경력과 차등. 같은 회사에서 'AI 플랫폼' 직무로 입사해도 통신 OSS 프로젝트에 투입될 수 있음.",
          similarity: 0.86, specificity: 0.85, final_score: 0.73,
        },
      ],
      warnings: [
        "⚫ AI 라벨 있어도 SI는 SI: AI/Big Data/통신 OSS 솔루션 회사는 자사 제품 회사와 다르게 평가됨. 고객사 파견·정부 R&D 과제로 근무지 유동, 문서 산출물 다수, 이력서에 'AI 솔루션 개발'로 인식되어 'AI 제품 개발' 경력과 차등. 같은 회사에서 'AI 플랫폼' 직무로 입사해도 통신 OSS 프로젝트에 투입될 수 있음.",
        "SI 납품 구조 특성상 실질적 커리어 전이성 낮음",
      ],
    },
  },
];
