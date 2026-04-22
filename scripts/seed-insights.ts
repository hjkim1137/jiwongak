/**
 * scripts/seed-insights.ts
 *
 * data/industry_insights.seed.json을 읽어 Voyage voyage-3로 임베딩 생성 후
 * Supabase industry_insights 테이블에 upsert (slug 기준).
 *
 * 실행:
 *   tsx scripts/seed-insights.ts
 *
 * 필요한 환경변수 (.env.local):
 *   VOYAGE_API_KEY=...
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   ← service role (RLS 우회 필요)
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// ---------- 타입 ----------

type InsightType =
  | "career_ceiling"
  | "lockin_risk"
  | "scarcity_value"
  | "transferability"
  | "growth_outlook"
  | "culture_pattern"
  | "compensation_pattern";

type Severity = "info" | "warn" | "critical";
type SourceType = "official_data" | "curated_analysis" | "community_consensus";

interface SeedInsight {
  slug: string;
  industry?: string;
  sub_industry?: string;
  job_category?: string; // 17개 직군 중 1개 (개발/엔지니어링, 금융 전문직 등)
  job_function?: string;
  job_level?: "core" | "minor" | null;
  insight_type: InsightType;
  severity: Severity;
  title: string;
  content: string;
  evidence_urls?: string[];
  source_type?: SourceType;
}

interface SeedFile {
  insights: SeedInsight[];
}

// ---------- Voyage 임베딩 ----------

const VOYAGE_MODEL = "voyage-3";
const VOYAGE_DIM = 1024;
const BATCH_SIZE = 10; // free tier: 3 RPM + 10K TPM 대응 (10 items × ~200 tok = 2K/batch)

async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY not set");

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
      input_type: "document", // 인덱싱 시 'document', 검색 시 'query'
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
  };

  // index 순서 보장 (API가 항상 보장하지만 명시적으로 정렬)
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((d) => {
      if (d.embedding.length !== VOYAGE_DIM) {
        throw new Error(
          `Embedding dim mismatch: expected ${VOYAGE_DIM}, got ${d.embedding.length}`,
        );
      }
      return d.embedding;
    });
}

// ---------- 메인 ----------

async function main() {
  const seedPath = resolve(process.cwd(), "data/industry_insights.seed.json");
  const raw = await readFile(seedPath, "utf-8");
  const { insights } = JSON.parse(raw) as SeedFile;

  console.log(`Loaded ${insights.length} insights from ${seedPath}`);

  // 임베딩용 텍스트: title + content (제목이 약한 신호도 추가됨)
  const texts = insights.map((i) => `${i.title}\n\n${i.content}`);

  // 배치로 임베딩 (rate limit 3 RPM 대응: 배치 간 21초 대기)
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchNum = i / BATCH_SIZE + 1;
    const totalBatches = Math.ceil(texts.length / BATCH_SIZE);
    console.log(`Embedding batch ${batchNum}/${totalBatches} (${batch.length} items)...`);
    const vecs = await embedBatch(batch);
    embeddings.push(...vecs);
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 21_000)); // 3 RPM → 20s 간격 (여유 1s)
    }
  }

  // Supabase upsert
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const rows = insights.map((insight, idx) => ({
    slug: insight.slug,
    industry: insight.industry ?? null,
    sub_industry: insight.sub_industry ?? null,
    job_category: insight.job_category ?? null,
    job_function: insight.job_function ?? null,
    job_level: insight.job_level ?? null,
    insight_type: insight.insight_type,
    severity: insight.severity,
    title: insight.title,
    content: insight.content,
    evidence_urls: insight.evidence_urls ?? [],
    source_type: insight.source_type ?? "curated_analysis",
    embedding: embeddings[idx],
    last_verified_at: new Date().toISOString(),
  }));

  const { error, count } = await supabase
    .from("industry_insights")
    .upsert(rows, { onConflict: "slug", count: "exact" });

  if (error) throw error;

  console.log(`✅ Upserted ${count ?? rows.length} insights`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
