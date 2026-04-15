/**
 * [1] parsePosting — Claude Haiku Tool Use로 공고 텍스트 → 구조화 JSON
 *
 * - claude-haiku-4-5: 파싱은 가벼운 모델로 비용 절감
 * - Tool Use: JSON 스키마 강제 → 파싱 에러 0%
 * - temperature: 0 → 결정성
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  INDUSTRIES,
  JOB_CATEGORIES,
  type ParsedPosting,
} from "@/types/analysis";

const client = new Anthropic();

const PARSE_TOOL: Anthropic.Tool = {
  name: "extract_posting",
  description:
    "채용공고에서 구조화된 정보를 추출. 직군 무관(개발/디자인/마케팅/영업/금융/공공/생산/건설/의료 등 모두 지원).",
  input_schema: {
    type: "object" as const,
    required: [
      "company",
      "industry",
      "job_category",
      "job_function",
      "requirements",
      "raw_signals",
    ],
    properties: {
      company: { type: "string", description: "회사명" },
      industry: {
        type: "string",
        enum: [...INDUSTRIES],
        description: "산업 분류",
      },
      sub_industry: { type: "string", description: "세부 산업 (선택)" },
      job_category: {
        type: "string",
        enum: [...JOB_CATEGORIES],
        description: "직군 대분류 (사람인 기준 21개)",
      },
      job_function: {
        type: "string",
        description:
          "카테고리 내 세부 직무. 예: IT개발이면 '프론트엔드'/'백엔드', 영업이면 '기술영업'/'해외영업', 금융이면 'IB(투자은행)', 의료면 '간호사', 생산이면 '공정엔지니어' 등",
      },
      job_level_hint: {
        type: "string",
        enum: ["core", "minor"],
        description:
          "해당 산업에서 이 직무가 코어 직무인지 마이너 직무인지. 판단 어려우면 생략",
      },
      requirements: {
        type: "object",
        description:
          "직군별 매칭 대상이 다름: IT=기술스택, 영업=실적/네트워크, 디자인=포폴/도구, 금융=자격증, 공공=시험/등급, 생산=설비/공정, 의료=면허/경력",
        required: ["explicit", "implicit", "nice_to_have"],
        properties: {
          explicit: {
            type: "array",
            items: { type: "string" },
            description: "자격요건에 명시된 것",
          },
          implicit: {
            type: "array",
            items: { type: "string" },
            description: "본문에서 추론한 묵시적 요구",
          },
          nice_to_have: {
            type: "array",
            items: { type: "string" },
            description: "우대사항",
          },
        },
      },
      raw_signals: {
        type: "object",
        required: ["wlb_keywords", "growth_keywords"],
        properties: {
          salary_mentioned: {
            type: "number",
            description: "언급된 연봉/월급 (만원 단위). 없으면 생략",
          },
          wlb_keywords: {
            type: "array",
            items: { type: "string" },
            description:
              "WLB 관련 키워드 (유연근무, 재택, 칼퇴, 주4일, 탄력근무 등)",
          },
          growth_keywords: {
            type: "array",
            items: { type: "string" },
            description:
              "성장/커리어 관련 키워드 (교육지원, 컨퍼런스, 승진, 스톡옵션 등)",
          },
        },
      },
    },
  },
};

export async function parsePosting(rawText: string): Promise<ParsedPosting> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2000,
    temperature: 0,
    tools: [PARSE_TOOL],
    tool_choice: { type: "tool", name: "extract_posting" },
    messages: [
      {
        role: "user",
        content: `다음 채용공고에서 구조화된 정보를 추출하세요. 본문에 근거가 있는 것만 추출하고, 추측하지 마세요.\n\n${rawText}`,
      },
    ],
  });

  const toolUse = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );

  if (!toolUse) {
    throw new Error("parsePosting: Tool use not returned from Claude");
  }

  return toolUse.input as ParsedPosting;
}
