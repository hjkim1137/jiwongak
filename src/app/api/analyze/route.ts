/**
 * POST /api/analyze
 *
 * 공고 텍스트 → 5단계 라벨 결과 반환.
 * 비회원도 사용 가능 (DB 저장은 로그인 사용자만).
 *
 * Request body: { rawText: string }
 * Response: AnalysisResult
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { parsePosting } from "@/lib/analysis/parse-posting";
import { retrieveInsights } from "@/lib/analysis/retrieve-insights";
import { scoreDimensions } from "@/lib/analysis/score-dimensions";
import { composeResult } from "@/lib/analysis/compose-result";
import { getAdminClient } from "@/lib/supabase";
import type { UserProfile } from "@/types/analysis";

function hashText(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex");
}

async function getUser(request: NextRequest) {
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

  return {
    id: userId,
    career_years: profile.career_years,
    current_position: profile.current_position,
    lifestyle_type: profile.lifestyle_type ?? "balanced",
    job_category: profile.job_category,
    skills: (skills ?? []).map((s: any) => ({
      name: s.name,
      category: s.category,
      level: s.level,
      years: s.years,
      evidence: s.evidence,
    })),
  };
}

// 비회원용 기본 프로필
const DEFAULT_PROFILE: UserProfile = {
  id: "anonymous",
  lifestyle_type: "balanced",
  skills: [],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawText = body.rawText?.trim();

    if (!rawText || rawText.length < 50) {
      return NextResponse.json(
        { error: "공고 텍스트가 너무 짧습니다 (최소 50자)" },
        { status: 400 },
      );
    }

    const adminClient = getAdminClient();
    const { user } = await getUser(request);
    const hash = hashText(rawText);

    // 캐시 확인 (로그인 사용자만)
    if (user) {
      const { data: cached } = await adminClient
        .from("applications")
        .select("analysis_cache")
        .eq("user_id", user.id)
        .eq("raw_text_hash", hash)
        .eq("is_stale", false)
        .single();

      if (cached?.analysis_cache) {
        return NextResponse.json(cached.analysis_cache);
      }
    }

    const t0 = Date.now();

    // loadProfile + parsePosting 병렬 실행 (두 작업은 완전 독립)
    const [profile, posting] = await Promise.all([
      user
        ? loadProfile(adminClient, user.id).then((p) => p ?? DEFAULT_PROFILE)
        : Promise.resolve(DEFAULT_PROFILE),
      parsePosting(rawText),
    ]);
    console.log(`[analyze] parse+profile: ${Date.now() - t0}ms`);

    const t1 = Date.now();
    const insights = await retrieveInsights(posting, adminClient);
    console.log(`[analyze] retrieveInsights: ${Date.now() - t1}ms`);

    const t2 = Date.now();
    const scores = await scoreDimensions(posting, profile, insights);
    console.log(`[analyze] scoreDimensions: ${Date.now() - t2}ms`);

    const result = composeResult(scores, profile, insights);
    console.log(`[analyze] total: ${Date.now() - t0}ms`);

    // DB 저장 (로그인 사용자만)
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

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/analyze] Error:", err);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
