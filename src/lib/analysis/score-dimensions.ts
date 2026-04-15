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

function buildSystemPrompt(
  profile: UserProfile,
  insights: RetrievedInsight[],
): string {
  const skillList = profile.skills
    .map((s) => `- ${s.name} (${s.category}, Lv${s.level}, ${s.years ?? "?"}년)${s.evidence ? ` — ${s.evidence}` : ""}`)
    .join("\n");

  const insightList = insights
    .map(
      (i) =>
        `[${i.slug}] (${i.severity}) ${i.title}: ${i.content}`,
    )
    .join("\n");

  return `당신은 채용 적합도 분석 AI입니다.

# 사용자 프로필
- 경력: ${profile.career_years ?? "미입력"}년
- 현재 직무: ${profile.current_position ?? "미입력"}
- 라이프스타일 타입: ${profile.lifestyle_type}
- 직군: ${profile.job_category ?? "미입력"}

# 사용자 보유 스킬
${skillList || "(스킬 미입력)"}

# 검색된 산업/직무 인사이트 (이것만 근거로 사용. 추측 금지)
${insightList || "(관련 인사이트 없음)"}

# 채점 규칙
1. skill_match: 사용자 스킬과 공고 요구사항을 1:1 비교하여 채점. evidence에 매칭된 스킬명 인용
2. wlb: 공고의 WLB 신호(야근, 재택, 유연근무 등) + 인사이트의 culture_pattern 근거로 채점
3. career_ceiling: 위 인사이트만 근거로 사용. 인사이트가 없으면 confidence=0.3 이하로 설정
4. evidence에는 반드시 사용자 스킬명 또는 인사이트 slug를 인용. 근거 없는 점수 금지
5. 같은 입력에 대해 항상 같은 점수가 나와야 함 (결정적)
6. severity=critical 인사이트가 있으면 flags에 반드시 경고 포함`;
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

export async function scoreDimensions(
  posting: ParsedPosting,
  profile: UserProfile,
  insights: RetrievedInsight[],
): Promise<DimensionScore[]> {
  const systemPrompt = buildSystemPrompt(profile, insights);

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    temperature: 0,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" }, // Prompt Cache (5분 TTL)
      },
    ],
    tools: [SCORE_TOOL],
    tool_choice: { type: "tool", name: "score_posting" },
    messages: [
      {
        role: "user",
        content: buildUserMessage(posting),
      },
    ],
  });

  const toolUse = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );

  if (!toolUse) {
    throw new Error("scoreDimensions: Tool use not returned from Claude");
  }

  const raw = toolUse.input as Record<string, any>;

  // cache hit 로그 (개발용)
  const usage = res.usage as any;
  if (usage.cache_read_input_tokens) {
    console.log(
      `[scoreDimensions] Prompt Cache HIT: ${usage.cache_read_input_tokens} tokens read from cache`,
    );
  } else if (usage.cache_creation_input_tokens) {
    console.log(
      `[scoreDimensions] Prompt Cache MISS: ${usage.cache_creation_input_tokens} tokens cached`,
    );
  }

  return DIMENSIONS.map((dim) => ({
    dimension: dim,
    score: raw[dim].score,
    confidence: raw[dim].confidence,
    evidence: raw[dim].evidence ?? [],
    flags: raw[dim].flags ?? [],
  }));
}
