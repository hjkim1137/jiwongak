import type { AnalysisResult } from "@/types/analysis";

export interface DemoPosting {
  companyType: string;
  position: string;
  scenario: string;
  result: AnalysisResult;
}

export const DEMO_POSTINGS: DemoPosting[] = [
  // ─── 1. 지원각 ───────────────────────────────────────────────────────────────
  {
    companyType: "국내 AI B2B SaaS 스타트업",
    position: "프론트엔드 개발자",
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

  // ─── 2. 고민각 ───────────────────────────────────────────────────────────────
  {
    companyType: "국내 DevTools SaaS 기업",
    position: "프론트엔드 개발자",
    scenario: "스킬·WLB 우수하나 커리어 성장성 제한적",
    result: {
      composite_score: 76,
      label: "고민각",
      lifestyle_type: "njob_lifer",
      job_category: "IT개발·데이터",
      career_stage: "junior",
      dimensions: [
        { dimension: "skill_match",    score: 80, confidence: 0.88, evidence: ["React", "TypeScript", "TanStack Query"], flags: [] },
        { dimension: "wlb",           score: 84, confidence: 0.8,  evidence: ["시차출근", "연차 무제한"],               flags: [] },
        { dimension: "career_ceiling", score: 52, confidence: 0.75, evidence: ["devtools-observability-frontend-scarcity"], flags: ["B2B 모니터링 특화 도메인 — 이직 선택지가 일반 SaaS 대비 좁을 수 있음"] },
      ],
      cited_insights: [
        {
          id: "devtools-observability-frontend-scarcity",
          slug: "devtools-observability-frontend-scarcity",
          insight_type: "scarcity_value",
          severity: "info",
          title: "데이터 시각화 깊이로 차별화",
          content: "실시간 모니터링 대시보드, 시계열 데이터 시각화(D3.js, ECharts), 대용량 데이터 렌더링 경험은 시장에서 희소. Observability/APM 도구 기업으로 연결되는 커리어 트랙. AI 도메인은 아니지만 AI Ops 확장으로 일부 매칭.",
          similarity: 0.84, specificity: 0.85, final_score: 0.71,
        },
      ],
      warnings: ["B2B 모니터링 특화 도메인 — 이직 선택지가 일반 SaaS 대비 좁을 수 있음"],
    },
  },

  // ─── 3. 애매각 ───────────────────────────────────────────────────────────────
  {
    companyType: "대기업 계열 SI 기업",
    position: "풀스택 개발자",
    scenario: "스킬 일부 매칭, WLB 불명확, 이직 전이성 낮음",
    result: {
      composite_score: 50,
      label: "애매각",
      lifestyle_type: "njob_lifer",
      job_category: "IT개발·데이터",
      career_stage: "junior",
      dimensions: [
        { dimension: "skill_match",    score: 60, confidence: 0.8,  evidence: ["Java", "Spring Boot", "React"],            flags: [] },
        { dimension: "wlb",           score: 55, confidence: 0.55, evidence: [],                                           flags: ["WLB 구체 정보 없음 — 대기업 SI 기준 야근 가능성"] },
        { dimension: "career_ceiling", score: 20, confidence: 0.75, evidence: ["si-frontend-low-transferability"],          flags: ["레거시 기술 스택 포함 (JSP, jQuery) — 기술 부채 비중 높을 수 있음"] },
      ],
      cited_insights: [
        {
          id: "si-frontend-low-transferability",
          slug: "si-frontend-low-transferability",
          insight_type: "transferability",
          severity: "warn",
          title: "B2C/SaaS로 이직 어려움",
          content: "SI 프론트 경력은 SaaS/B2C 회사 이직 시 자사 제품 운영 경험 부족으로 인식되는 경향. UX 개선 사이클, A/B 테스트, 실시간 데이터 처리, 대용량 트래픽 경험이 부족하다고 판단될 수 있음.",
          similarity: 0.78, specificity: 0.85, final_score: 0.66,
        },
      ],
      warnings: [
        "WLB 구체 정보 없음 — 대기업 SI 기준 야근 가능성",
        "레거시 기술 스택 포함 (JSP, jQuery) — 기술 부채 비중 높을 수 있음",
      ],
    },
  },

  // ─── 4. 패스각 ───────────────────────────────────────────────────────────────
  {
    companyType: "소비재 스타트업",
    position: "퍼포먼스 마케터",
    scenario: "직군 완전 미스매칭 케이스",
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

  // ─── 5. 함정각 ───────────────────────────────────────────────────────────────
  {
    companyType: "산업 AI 솔루션 기업",
    position: "AI 플랫폼 프론트엔드 개발자",
    scenario: "점수는 높아 보이나 구조적 커리어 위험 존재",
    result: {
      composite_score: 69,
      label: "함정각",
      lifestyle_type: "njob_lifer",
      job_category: "IT개발·데이터",
      career_stage: "junior",
      dimensions: [
        { dimension: "skill_match",    score: 85, confidence: 0.9,  evidence: ["React", "TypeScript", "si-solution-disguised-as-ai"], flags: [] },
        { dimension: "wlb",           score: 72, confidence: 0.7,  evidence: [],                                                       flags: [] },
        { dimension: "career_ceiling", score: 30, confidence: 0.85, evidence: ["si-solution-disguised-as-ai"],                          flags: ["SI 납품 구조 특성상 커리어 전이성 낮음"] },
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
        "SI 납품 구조 특성상 커리어 전이성 낮음",
      ],
    },
  },
];
