/**
 * [3] scoreDimensions — Claude Sonnet + Prompt Cache + Tool Use
 *
 * 사용자 프로필 + 검색된 인사이트를 system 프롬프트에 주입 (Prompt Cache)
 * → 공고를 user 메시지로 전달
 * → Tool Use로 dimension별 점수+근거 JSON 강제 추출
 *
 * - claude-sonnet-4-6: 채점은 정밀한 모델 필요
 * - Prompt Cache: 같은 사용자가 여러 공고 분석 시 system 프롬프트 캐싱 (5분 TTL)
 * - temperature: 0 → 결정성
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  ParsedPosting,
  RetrievedInsight,
  DimensionScore,
  UserProfile,
  Dimension,
} from "@/types/analysis";

const client = new Anthropic();

const DIMENSIONS: Dimension[] = ["skill_match", "wlb", "career_ceiling"];

const LIFESTYLE_TYPE_KO: Record<string, string> = {
  njob_lifer: "워라밸+사이드 양립형",
  growth_challenger: "성장형 도전자",
  jumper: "이직 점프형",
  stable_wlb: "안정·WLB 중시",
  founder_to_be: "창업 지향",
  balanced: "균형형",
};

function dimensionSchema(name: string) {
  return {
    type: "object" as const,
    required: ["score", "confidence", "evidence", "flags"],
    properties: {
      score: {
        type: "integer" as const,
        minimum: 0,
        maximum: 100,
        description: `${name} 점수 (0=최악, 100=최상)`,
      },
      confidence: {
        type: "number" as const,
        minimum: 0,
        maximum: 1,
        description: "데이터 충분도. 근거 부족 시 0.5 미만",
      },
      evidence: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "근거. 사용자 스킬명 또는 인사이트 slug를 반드시 인용",
      },
      flags: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "주의사항 (해당 없으면 빈 배열)",
      },
    },
  };
}

const SCORE_TOOL: Anthropic.Tool = {
  name: "score_posting",
  description: "공고와 사용자 프로필의 적합도를 dimension별로 점수화",
  input_schema: {
    type: "object" as const,
    required: ["skill_match", "wlb", "career_ceiling"],
    properties: {
      skill_match: dimensionSchema("스킬 매칭"),
      wlb: dimensionSchema("워라밸"),
      career_ceiling: dimensionSchema("커리어 천장"),
    },
  },
};

/**
 * 프로필 + 채점 규칙 (캐시 대상).
 * 같은 사용자가 여러 공고 분석 시 이 블록이 캐시 히트.
 */
function buildProfilePrompt(profile: UserProfile): string {
  const skillList = profile.skills
    .map((s) => `- ${s.name} (${s.category}, Lv${s.level}, ${s.years ?? "?"}년)${s.evidence ? ` — ${s.evidence}` : ""}`)
    .join("\n");

  return `당신은 채용 적합도 분석 AI입니다.

# 사용자 프로필
- 경력: ${profile.career_years ?? "미입력"}년
- 현재 직무: ${profile.current_position ?? "미입력"}
- 라이프스타일 타입: ${LIFESTYLE_TYPE_KO[profile.lifestyle_type] ?? profile.lifestyle_type}
- 직군: ${profile.job_category ?? "미입력"}

# 사용자 보유 스킬
${skillList || "(개별 스킬 미등록 — 직군 기반으로만 매칭 판단할 것)"}

# 채점 규칙
1. skill_match: 사용자 스킬과 공고 요구사항을 1:1 비교. evidence에 매칭된 스킬명 인용
2. wlb: 공고의 WLB 신호 + 인사이트의 culture_pattern 근거로 채점
3. career_ceiling: 반드시 다음 관점으로 채점한다.
   **"이 포지션 경험이 본인의 개발자 커리어 이직 시장 가치를 얼마나 높이는가?"**
   - 인사이트(career_ceiling/lockin_risk/scarcity_value 타입)만 근거로 사용. 인사이트가 없으면 confidence=0.3 이하
   - **직군 미스매치 페널티**: 공고 직군이 사용자 직군과 완전히 다른 트랙(예: 개발자 프로필인데 디자인/영업/재무/마케팅 공고)이면 career_ceiling = 0~15. 해당 경험은 개발자 이직 시장에서 가치 없음
   - **니치 산업 페널티**: 산업 AI 솔루션/SI/솔루션/유지보수/제조 특화 도메인은 이직 선택지가 좁아짐 → career_ceiling ≤ 55
   - "AI 회사라 흥미롭다", "성장 중인 산업이다" 같은 일반적 산업 매력도 평가 금지. 오직 본인 커리어 이전 가능성(transferability) 기준으로만 채점
4. **evidence 형식 필수**: 인사이트를 근거로 쓸 때 반드시 slug를 그대로 넣어라. 예: "robotics-frontend-not-core". 스킬을 근거로 쓸 때는 스킬명. 설명문 금지, slug/스킬명만
5. 같은 입력에 대해 항상 같은 점수 (결정적)
6. severity=critical 인사이트가 있으면: (a) 해당 dimension의 evidence에 해당 slug 필수 포함 (b) flags에 경고 필수 포함
7. **flags 규칙**: 공고·산업·직무에서 발견된 구체적 위험 신호만 넣는다. "신호 없음", "근거 부족", "불확실", "판단 어려움", "스킬 미입력", "스킬 없음", "매칭 불가" 같은 불확실성·데이터 부재 메모는 flags에 절대 넣지 않는다 — 불확실성은 confidence 값(0~1)으로만 표현한다`;
}

/**
 * 인사이트 블록 (공고마다 다름, 캐시 대상 아님).
 */
function buildInsightsPrompt(insights: RetrievedInsight[]): string {
  const insightList = insights
    .map(
      (i) =>
        `[${i.slug}] (${i.severity}) ${i.title}: ${i.content}`,
    )
    .join("\n");

  return `# 검색된 산업/직무 인사이트 (이것만 근거로 사용. 추측 금지)
${insightList || "(관련 인사이트 없음)"}`;
}

function buildUserMessage(posting: ParsedPosting): string {
  return `다음 공고를 위 사용자 프로필과 비교하여 채점하세요.

회사: ${posting.company}
산업: ${posting.industry}${posting.sub_industry ? ` > ${posting.sub_industry}` : ""}
직군: ${posting.job_category} > ${posting.job_function}
코어 직무 여부: ${posting.job_level_hint ?? "판단 불가"}

명시 요구사항: ${posting.requirements.explicit?.join(", ") || "없음"}
묵시 요구사항: ${posting.requirements.implicit?.join(", ") || "없음"}
우대사항: ${posting.requirements.nice_to_have?.join(", ") || "없음"}

WLB 신호: ${posting.raw_signals?.wlb_keywords?.join(", ") || "없음"}
성장 신호: ${posting.raw_signals?.growth_keywords?.join(", ") || "없음"}
${posting.raw_signals?.salary_mentioned ? `연봉: ${posting.raw_signals.salary_mentioned}만원` : ""}`;
}

interface DimRaw {
  score: number;
  confidence: number;
  evidence: string[];
  flags: string[];
}

async function callScoreAPI(
  profilePrompt: string,
  insightsPrompt: string,
  posting: ParsedPosting,
): Promise<{ raw: Record<string, DimRaw>; usage: Record<string, unknown> }> {
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    temperature: 0,
    system: [
      {
        type: "text",
        text: profilePrompt,
        cache_control: { type: "ephemeral" }, // ★ 프로필은 캐시 (5분 TTL)
      },
      {
        type: "text",
        text: insightsPrompt,
      },
    ],
    tools: [SCORE_TOOL],
    tool_choice: { type: "tool", name: "score_posting" },
    messages: [{ role: "user", content: buildUserMessage(posting) }],
  });

  const toolUse = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse) throw new Error("scoreDimensions: Tool use not returned from Claude");

  const raw = toolUse.input as Record<string, DimRaw>;
  const missingDims = DIMENSIONS.filter((d) => !raw[d]);
  if (missingDims.length > 0) {
    console.warn(`[scoreDimensions] Missing dimensions: ${missingDims.join(", ")}. raw keys: ${Object.keys(raw).join(", ")}`);
    throw new Error(`scoreDimensions: Missing dimensions: ${missingDims.join(", ")}`);
  }

  return { raw, usage: res.usage as unknown as Record<string, unknown> };
}

export async function scoreDimensions(
  posting: ParsedPosting,
  profile: UserProfile,
  insights: RetrievedInsight[],
): Promise<DimensionScore[]> {
  const profilePrompt = buildProfilePrompt(profile);
  const insightsPrompt = buildInsightsPrompt(insights);

  // 위촉직·비정형 공고에서 Claude가 간헐적으로 dimension 누락 → 최대 2회 재시도
  let raw: Record<string, DimRaw> | null = null;
  let usage: Record<string, unknown> = {};
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      ({ raw, usage } = await callScoreAPI(profilePrompt, insightsPrompt, posting));
      break;
    } catch (err) {
      if (attempt === 2) throw err;
      console.warn(`[scoreDimensions] attempt ${attempt} failed, retrying…`);
    }
  }

  // cache hit 로그 (개발용)
  const cacheRead = (usage.cache_read_input_tokens as number) ?? 0;
  const cacheCreate = (usage.cache_creation_input_tokens as number) ?? 0;
  if (cacheRead > 0) {
    console.log(`[scoreDimensions] Prompt Cache HIT: ${cacheRead} tokens read from cache`);
  } else if (cacheCreate > 0) {
    console.log(`[scoreDimensions] Prompt Cache MISS: ${cacheCreate} tokens cached`);
  } else {
    console.log(`[scoreDimensions] Prompt Cache: no cache activity (usage: ${JSON.stringify(usage)})`);
  }

  // 스킬·데이터 부재 관련 노이즈 flags 후처리 제거
  // (프롬프트 규칙만으로는 Claude가 무시하는 경우가 있어 코드로 확실히 필터)
  const NOISE_PATTERNS = ["스킬", "미입력", "매칭 불가", "스킬 없음", "미등록"];
  // Claude가 flags 텍스트 안에 slug를 노출하는 경우 제거 (내부 식별자, UI 비노출)
  // 패턴 1: "slug: 텍스트" — 문장 앞 slug 접두어
  // 패턴 2: "(slug ...)" — 괄호 내 slug
  // 패턴 3: "— slug ..." — em-dash 뒤 slug (이후 문장 끝까지 제거)
  const S = `[a-z][a-z0-9]*(?:-[a-z0-9]+)+`;
  const stripSlugs = (text: string) =>
    text
      .replace(new RegExp(`^${S}:\\s*`), "")
      .replace(new RegExp(`\\s*[—–]\\s*${S}.*$`), "")
      .replace(new RegExp(`\\s*\\(${S}[^)]*\\)`, "g"), "")
      .trim();
  const cleanFlags = (flags: string[]) =>
    flags
      .filter((f) => !NOISE_PATTERNS.some((p) => f.includes(p)))
      .map(stripSlugs);

  const result = DIMENSIONS.map((dim) => ({
    dimension: dim,
    score: raw![dim].score as number,
    confidence: raw![dim].confidence as number,
    evidence: (raw![dim].evidence ?? []) as string[],
    flags: cleanFlags((raw![dim].flags ?? []) as string[]),
  }));

  // skills가 없으면 skill_match flags 강제 초기화
  // (직군 기반 추정 시 스킬 관련 플래그는 의미 없음 — 패턴 필터로 잡히지 않는 변형도 차단)
  if (profile.skills.length === 0) {
    const idx = result.findIndex((d) => d.dimension === "skill_match");
    if (idx !== -1) {
      result[idx] = { ...result[idx], flags: [] };
    }
  }

  // 비회원(프로필 없음)일 때만 skill_match confidence=0 강제
  // 로그인 사용자는 skills가 없어도 job_category 기반으로 Claude가 채점
  if (profile.id === "anonymous") {
    const idx = result.findIndex((d) => d.dimension === "skill_match");
    if (idx !== -1) {
      result[idx] = {
        dimension: "skill_match",
        score: 50,
        confidence: 0,
        evidence: [],
        flags: [],
      };
    }
  }

  return result;
}
