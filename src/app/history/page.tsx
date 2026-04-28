import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HistoryClient } from "./_components/history-client";
import type { AnalysisResult } from "@/types/analysis";

export type ApplicationRow = {
  id: string;
  company: string;
  job_category: string | null;
  job_function: string | null;
  match_score: number;
  label: string;
  analysis_cache: AnalysisResult;
  raw_text: string;
  created_at: string;
  is_stale: boolean;
};

export default async function HistoryPage() {
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
          } catch {}
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/history");

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, company, job_category, job_function, match_score, label, analysis_cache, raw_text, created_at, is_stale",
    )
    .order("created_at", { ascending: false });

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8 sm:py-12 font-sans">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            홈
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">
            분석 기록
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            내가 분석한 채용공고 목록
          </p>
        </div>

        <HistoryClient applications={(applications ?? []) as ApplicationRow[]} />
      </div>
    </main>
  );
}
