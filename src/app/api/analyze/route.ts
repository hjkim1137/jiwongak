/**
 * POST /api/analyze
 *
 * 공고 텍스트 → SSE 스트림으로 진행 단계 + 최종 결과 반환.
 * 비회원도 사용 가능 (DB 저장은 로그인 사용자만).
 *
 * Request body: { rawText: string }
 * SSE events:
 *   { type: "progress", step: "parsing" | "insights" | "scoring" }
 *   { type: "result", data: AnalysisResult }
 *   { type: "error", error: string }
 */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { parsePosting } from "@/lib/analysis/parse-posting";
import { retrieveInsights } from "@/lib/analysis/retrieve-insights";
import { scoreDimensions } from "@/lib/analysis/score-dimensions";
import { composeResult } from "@/lib/analysis/compose-result";
import { getAdminClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import type { UserProfile } from "@/types/analysis";

function hashText(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex");
}

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 쿠키 쓰기 불가 시 무시
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}

async function loadProfile(
  adminClient: ReturnType<typeof getAdminClient>,
  userId: string,
): Promise<UserProfile | null> {
  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const { data: skills } = await adminClient
    .from("skills")
    .select("*")
    .eq("user_id", userId);

  const diagAnswers = profile.diagnosis_answers as Record<string, { careerStage?: string }> | null;
  const careerStage = diagAnswers?.q0?.careerStage as
    | "entry"
    | "junior"
    | "senior"
    | undefined;

  return {
    id: userId,
    career_years: profile.career_years,
    career_stage: careerStage,
    current_position: profile.current_position,
    lifestyle_type: profile.lifestyle_type ?? "balanced",
    job_category: profile.job_category,
    skills: (skills ?? []).map((s: { name: string; category: string; level: number; years: number | null; evidence: string | null }) => ({
      name: s.name,
      category: s.category,
      level: s.level,
      years: s.years ?? undefined,
      evidence: s.evidence ?? undefined,
    })),
  };
}

const DEFAULT_PROFILE: UserProfile = {
  id: "anonymous",
  lifestyle_type: "balanced",
  skills: [],
};

export async function POST(request: NextRequest) {
  // 입력 검증 (비스트리밍)
  const body = await request.json().catch(() => null);
  const rawText = (body?.rawText as string | undefined)?.trim();

  if (!rawText || rawText.length < 50) {
    return NextResponse.json(
      { error: "공고 텍스트가 너무 짧습니다 (최소 50자)" },
      { status: 400 },
    );
  }

  const adminClient = getAdminClient();
  const { user } = await getUser();

  // Rate limit (비스트리밍)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const { success, retryAfter } = await checkRateLimit(user?.id, ip);
  if (!success) {
    return NextResponse.json(
      { error: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." },
      {
        status: 429,
        headers: retryAfter ? { "Retry-After": String(retryAfter) } : {},
      },
    );
  }

  const hash = hashText(rawText);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );

      try {
        // 캐시 히트 → 즉시 결과 반환 (로그인 사용자만)
        if (user) {
          const { data: cached } = await adminClient
            .from("applications")
            .select("analysis_cache")
            .eq("user_id", user.id)
            .eq("raw_text_hash", hash)
            .eq("is_stale", false)
            .single();

          if (cached?.analysis_cache) {
            send({ type: "result", data: cached.analysis_cache });
            return;
          }
        }

        const t0 = Date.now();

        // Step 1: 공고 파싱 + 프로필 로드 (병렬)
        send({ type: "progress", step: "parsing" });
        const [profile, posting] = await Promise.all([
          user
            ? loadProfile(adminClient, user.id).then((p) => p ?? DEFAULT_PROFILE)
            : Promise.resolve(DEFAULT_PROFILE),
          parsePosting(rawText),
        ]);
        console.log(`[analyze] parse+profile: ${Date.now() - t0}ms`);

        // 공고 유효성 검증
        const hasRequirements =
          posting.requirements.explicit.length > 0 ||
          posting.requirements.implicit.length > 0 ||
          posting.requirements.nice_to_have.length > 0;
        const hasValidCompany =
          posting.company.length > 1 &&
          !["알 수 없음", "미확인", "unknown"].includes(
            posting.company.toLowerCase(),
          );

        if (!hasRequirements || !hasValidCompany) {
          send({
            type: "error",
            error:
              "채용공고 내용을 파악할 수 없습니다. 실제 공고 전문을 붙여넣어 주세요.",
          });
          return;
        }

        // Step 2: 인사이트 검색
        const t1 = Date.now();
        send({ type: "progress", step: "insights" });
        const insights = await retrieveInsights(posting, adminClient);
        console.log(`[analyze] retrieveInsights: ${Date.now() - t1}ms`);

        // Step 3: 점수 산출
        const t2 = Date.now();
        send({ type: "progress", step: "scoring" });
        const scores = await scoreDimensions(posting, profile, insights);
        console.log(`[analyze] scoreDimensions: ${Date.now() - t2}ms`);

        const baseResult = composeResult(scores, profile, insights);
        const result = {
          ...baseResult,
          ...(profile.id !== "anonymous"
            ? {
                lifestyle_type: profile.lifestyle_type,
                job_category: profile.job_category,
                career_stage: profile.career_stage,
              }
            : {}),
        };
        console.log(`[analyze] total: ${Date.now() - t0}ms`);

        // DB 저장 (로그인 사용자)
        if (user) {
          await adminClient.from("applications").upsert(
            {
              user_id: user.id,
              raw_text: rawText,
              raw_text_hash: hash,
              company: posting.company,
              industry: posting.industry,
              sub_industry: posting.sub_industry,
              job_category: posting.job_category,
              job_function: posting.job_function,
              extracted_requirements: posting.requirements,
              match_score: result.composite_score,
              label: result.label,
              analysis_cache: result,
              is_stale: false,
            },
            { onConflict: "user_id,raw_text_hash" },
          );
        }

        send({ type: "result", data: result });
      } catch (err) {
        console.error("[/api/analyze] Error:", err);
        send({ type: "error", error: "분석 중 오류가 발생했습니다" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
