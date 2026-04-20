/**
 * [2] retrieveInsights — 공고 기반 관련 인사이트 검색
 *
 * 1. 파싱된 공고에서 쿼리 텍스트 생성
 * 2. Voyage voyage-3로 쿼리 임베딩 (input_type: "query")
 * 3. match_insights RPC로 후보 검색 (메타필터 + cosine similarity)
 * 4. specificity 가중 후처리 → top-k 반환
 */

import type { ParsedPosting, RetrievedInsight } from "@/types/analysis";

// ── Voyage 쿼리 임베딩 ──

async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY not set");

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: [text],
      model: "voyage-3",
      input_type: "query", // 검색 시 query (시드 인덱싱 시 document)
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    data: { embedding: number[] }[];
  };
  return data.data[0].embedding;
}

// ── specificity 가중 ──

function calcSpecificity(
  row: { industry: string | null; job_category: string | null; job_function: string | null },
  posting: ParsedPosting,
): number {
  // null은 "모든 산업/직군에 범용 적용" 의미 — null === null은 매칭이 아님
  // (null인 시드가 industry가 없는 공고와 매칭되어 0.7을 받는 오류 방지)
  const indMatch = row.industry !== null && row.industry === posting.industry;
  const catMatch = row.job_category !== null && row.job_category === posting.job_category;
  const fnMatch = row.job_function !== null && row.job_function === posting.job_function;
  const allNull =
    row.industry == null && row.job_category == null && row.job_function == null;

  // industry가 명시된 인사이트는 해당 산업 공고에만 적용
  // catMatch/fnMatch가 있어도 industry 불일치면 완전 무관 (예: 제약영업 인사이트 → 보험 공고)
  if (row.industry !== null && !indMatch) return 0;

  if (indMatch && catMatch && fnMatch) return 1.0;
  if (indMatch && catMatch) return 0.85;
  if (indMatch) return 0.7;
  if (catMatch) return 0.5;
  if (allNull) return 0.4;
  return 0.2;
}

// ── 메인 ──

export async function retrieveInsights(
  posting: ParsedPosting,
  supabase: { rpc: Function },
  topK = 5,
): Promise<RetrievedInsight[]> {
  // 쿼리 텍스트: 산업 + 직무 + 명시 요구사항 상위 5개
  const queryText = [
    posting.industry,
    posting.sub_industry,
    posting.job_category,
    posting.job_function,
    ...posting.requirements.explicit.slice(0, 5),
  ]
    .filter(Boolean)
    .join(" ");

  const queryEmbedding = await embedQuery(queryText);

  const { data, error } = await supabase.rpc("match_insights", {
    query_embedding: queryEmbedding,
    target_industry: posting.industry,
    target_job_category: posting.job_category,
    target_job_function: posting.job_function,
    match_count: topK * 3, // 후보 넉넉히 → specificity 가중 후 top-k
  });

  if (error) throw new Error(`match_insights RPC error: ${error.message}`);
  if (!data || data.length === 0) return [];

  return (data as any[])
    .map((row) => {
      const specificity = calcSpecificity(row, posting);
      return {
        id: row.id,
        slug: row.slug,
        insight_type: row.insight_type,
        severity: row.severity,
        title: row.title,
        content: row.content,
        similarity: row.similarity,
        specificity,
        final_score: row.similarity * specificity,
      } satisfies RetrievedInsight;
    })
    // specificity=0.2는 산업·직군 전부 불일치 (완전 무관한 인사이트) → 제외
    // 관련 시드가 없으면 빈 배열 반환 (엉뚱한 인사이트 인용보다 낫다)
    .filter((r) => r.specificity > 0.2)
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, topK);
}
