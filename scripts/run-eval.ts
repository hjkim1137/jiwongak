/**
 * eval/run-eval.ts — 직군별 라벨 정확도 리포트
 *
 * 실행: npm run eval
 * 전제: .env.local에 ANTHROPIC_API_KEY, VOYAGE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정
 *
 * 산출물: 직군별 라벨 정확도 + dimension 델타 (gold vs actual)
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

import { parsePosting } from "../src/lib/analysis/parse-posting";
import { retrieveInsights } from "../src/lib/analysis/retrieve-insights";
import { scoreDimensions } from "../src/lib/analysis/score-dimensions";
import { composeResult } from "../src/lib/analysis/compose-result";
import { getAdminClient } from "../src/lib/supabase";
import type { UserProfile } from "../src/types/analysis";

const EVAL_DIR = resolve(process.cwd(), "eval");
const POSTINGS_DIR = join(EVAL_DIR, "postings");
const GOLD_LABELS_PATH = join(EVAL_DIR, "gold_labels.json");

interface GoldEntry {
  id: string;
  company: string;
  position: string;
  job_category: string;
  gold: { skill_match: number; wlb: number; career_ceiling: number };
  expected_label: string;
  composite_score: number;
}

interface GoldLabels {
  postings: GoldEntry[];
}

// 평가용 프로필 (njob_lifer, 2년차 풀스택)
const EVAL_PROFILE: UserProfile = {
  id: "eval-user",
  lifestyle_type: "njob_lifer",
  career_years: 2,
  career_stage: "junior",
  job_category: "IT개발·데이터",
  skills: [
    { name: "Flutter", category: "mobile", level: 3, years: 2, evidence: "의료기기 앱 개발" },
    { name: "React", category: "frontend", level: 3, years: 1.5, evidence: "웹 서비스 개발" },
    { name: "Next.js", category: "frontend", level: 3, years: 1, evidence: "풀스택 서비스 개발" },
    { name: "TypeScript", category: "frontend", level: 3, years: 1, evidence: "지원각 개발" },
    { name: "Spring Boot", category: "backend", level: 3, years: 2, evidence: "REST API 개발" },
    { name: "Java", category: "backend", level: 3, years: 2, evidence: "백엔드 개발" },
    { name: "PostgreSQL", category: "database", level: 2, years: 1, evidence: "Supabase 운용" },
    { name: "Zustand", category: "frontend", level: 3, years: 0.5, evidence: "지원각 상태관리" },
    { name: "TanStack Query", category: "frontend", level: 3, years: 0.5, evidence: "서버 상태 캐싱" },
    { name: "Claude API", category: "ai", level: 3, years: 0.5, evidence: "AI 서비스 개발" },
  ],
};

function pad(s: string, n: number) {
  return s.slice(0, n).padEnd(n);
}

async function runEval() {
  const goldLabels = JSON.parse(readFileSync(GOLD_LABELS_PATH, "utf-8")) as GoldLabels;
  const adminClient = getAdminClient();
  const postingFiles = readdirSync(POSTINGS_DIR);

  type EvalResult = {
    id: string;
    company: string;
    position: string;
    job_category: string;
    expected_label: string;
    actual_label: string;
    label_match: boolean;
    expected_composite: number;
    actual_composite: number;
    score_delta: number;
    dimension_deltas: { dimension: string; gold: number; actual: number; delta: number }[];
    error?: string;
  };

  const results: EvalResult[] = [];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  console.log("\n🔍 Eval 시작 — " + goldLabels.postings.length + "개 공고 분석 중...");
  console.log("(Voyage 3 RPM 한도 — 공고 간 21초 딜레이 적용)\n");

  let isFirst = true;
  for (const goldEntry of goldLabels.postings) {
    const matchingFile = postingFiles.find((f) => f.startsWith(goldEntry.id));

    if (!matchingFile) {
      console.warn(`  ⚠ 공고 파일 없음: ${goldEntry.id}`);
      continue;
    }

    const rawText = readFileSync(join(POSTINGS_DIR, matchingFile), "utf-8");

    try {
      if (!isFirst) await sleep(21000); // Voyage 3 RPM 한도 준수
      isFirst = false;

      process.stdout.write(`  분석: [${goldEntry.id}] ${goldEntry.company} — ${goldEntry.position} ... `);

      const posting = await parsePosting(rawText);
      const insights = await retrieveInsights(posting, adminClient);
      const scores = await scoreDimensions(posting, EVAL_PROFILE, insights);
      const result = composeResult(scores, EVAL_PROFILE, insights);

      const dimensionDeltas = (["skill_match", "wlb", "career_ceiling"] as const).map((dim) => {
        const dimScore = scores.find((s) => s.dimension === dim);
        return {
          dimension: dim,
          gold: goldEntry.gold[dim],
          actual: dimScore?.score ?? 0,
          delta: (dimScore?.score ?? 0) - goldEntry.gold[dim],
        };
      });

      const match = result.label === goldEntry.expected_label;
      console.log(match ? "✅" : `❌ (기대: ${goldEntry.expected_label}, 실제: ${result.label})`);

      results.push({
        id: goldEntry.id,
        company: goldEntry.company,
        position: goldEntry.position,
        job_category: goldEntry.job_category,
        expected_label: goldEntry.expected_label,
        actual_label: result.label,
        label_match: match,
        expected_composite: goldEntry.composite_score,
        actual_composite: result.composite_score,
        score_delta: result.composite_score - Math.round(goldEntry.composite_score),
        dimension_deltas: dimensionDeltas,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`❌ 오류: ${msg}`);
      results.push({
        id: goldEntry.id,
        company: goldEntry.company,
        position: goldEntry.position,
        job_category: goldEntry.job_category,
        expected_label: goldEntry.expected_label,
        actual_label: "ERROR",
        label_match: false,
        expected_composite: goldEntry.composite_score,
        actual_composite: 0,
        score_delta: 0,
        dimension_deltas: [],
        error: msg,
      });
    }
  }

  // ── 리포트 ──

  const SEP = "─".repeat(72);
  console.log("\n" + SEP);
  console.log("📊 Eval 결과");
  console.log(SEP);

  const labelMatches = results.filter((r) => r.label_match).length;
  const accuracy = results.length > 0 ? (labelMatches / results.length) * 100 : 0;

  console.log(`\n전체 라벨 정확도: ${labelMatches}/${results.length} (${accuracy.toFixed(0)}%)\n`);

  // 직군별
  const byCategory = new Map<string, EvalResult[]>();
  for (const r of results) {
    if (!byCategory.has(r.job_category)) byCategory.set(r.job_category, []);
    byCategory.get(r.job_category)!.push(r);
  }

  console.log("직군별 정확도:");
  for (const [cat, items] of byCategory) {
    const catMatch = items.filter((r) => r.label_match).length;
    console.log(`  ${cat}: ${catMatch}/${items.length}`);
  }

  // 개별 결과 테이블
  console.log("\n" + SEP);
  console.log(
    pad("ID", 14) +
      pad("기대", 8) +
      pad("실제", 8) +
      pad("Match", 8) +
      pad("기대점수", 10) +
      pad("실제점수", 10) +
      "델타",
  );
  console.log("─".repeat(62));

  for (const r of results) {
    const icon = r.label_match ? "✅" : "❌";
    const delta = (r.score_delta >= 0 ? "+" : "") + r.score_delta;
    console.log(
      pad(r.id, 14) +
        pad(r.expected_label, 8) +
        pad(r.actual_label, 8) +
        pad(icon, 8) +
        pad(String(r.expected_composite), 10) +
        pad(String(r.actual_composite), 10) +
        delta,
    );
  }

  // 미스매치 dimension 분석
  const mismatches = results.filter((r) => !r.label_match && !r.error);
  if (mismatches.length > 0) {
    console.log("\n" + SEP);
    console.log("❌ 미스매치 dimension 델타:");
    for (const r of mismatches) {
      console.log(`\n  [${r.id}] ${r.company} — ${r.position}`);
      console.log(`  기대: ${r.expected_label} | 실제: ${r.actual_label} | 점수 델타: ${r.score_delta >= 0 ? "+" : ""}${r.score_delta}`);
      for (const d of r.dimension_deltas) {
        const sign = d.delta >= 0 ? "+" : "";
        console.log(`    ${d.dimension.padEnd(16)} gold=${d.gold}  actual=${d.actual}  (${sign}${d.delta})`);
      }
    }
  }

  console.log("\n" + SEP);

  if (accuracy < 70) {
    console.log("⚠  정확도 70% 미만 — 프롬프트/시드 튜닝 필요\n");
    process.exit(1);
  } else {
    console.log(`✅ Eval 통과 (${accuracy.toFixed(0)}%)\n`);
    process.exit(0);
  }
}

runEval().catch((err) => {
  console.error("\nEval 실패:", err);
  process.exit(1);
});
