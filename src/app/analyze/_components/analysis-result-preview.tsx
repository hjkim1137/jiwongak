"use client";

import { LIFESTYLE_TYPE_META, CAREER_STAGE_META } from "@/types/diagnosis";
import type { AnalysisResult, Label, Severity } from "@/types/analysis";
import { getBrowserClient } from "@/lib/supabase";

export const LABEL_META: Record<
  Label,
  { emoji: string; color: string; bg: string; border: string }
> = {
  지원각: { emoji: "✅", color: "text-green-700",   bg: "bg-green-50",   border: "border-green-200"   },
  고민각: { emoji: "🤔", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  애매각: { emoji: "😐", color: "text-neutral-700", bg: "bg-neutral-100", border: "border-neutral-400" },
  패스각: { emoji: "⚠️", color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200"  },
  함정각: { emoji: "⚫", color: "text-white",        bg: "bg-neutral-900", border: "border-neutral-900" },
};

export const DIMENSION_LABEL: Record<string, string> = {
  skill_match:    "스킬 매칭",
  wlb:            "워라밸",
  career_ceiling: "성장성",
};

export const SEVERITY_STYLE: Record<Severity, { badge: string; border: string; bg: string }> = {
  info:     { badge: "bg-blue-100 text-blue-700",   border: "border-blue-100",  bg: "bg-blue-50"  },
  warn:     { badge: "bg-amber-100 text-amber-700", border: "border-amber-200", bg: "bg-amber-50" },
  critical: { badge: "bg-red-100 text-red-700",     border: "border-red-200",   bg: "bg-red-50"   },
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  info: "참고", warn: "주의", critical: "위험",
};

const NOISE_PATTERNS = ["스킬 미입력", "매칭 불가", "스킬 없음", "미등록", "스킬 정보", "개별 스킬"];
const isNoiseWarning = (w: string) => NOISE_PATTERNS.some((p) => w.includes(p));

const S = "[a-z][a-z0-9]*(?:-[a-z0-9]+)+";
const stripSlugs = (text: string) =>
  text
    .replace(new RegExp(`^${S}:\\s*`), "")
    .replace(new RegExp(`\\s*[—–]\\s*${S}.*$`), "")
    .replace(new RegExp(`\\s*\\(${S}[^)]*\\)`, "g"), "")
    .trim();

export function AnalysisResultPreview({ result }: { result: AnalysisResult }) {
  const meta = LABEL_META[result.label];
  const lifestyleMeta = result.lifestyle_type ? LIFESTYLE_TYPE_META[result.lifestyle_type] : null;

  const flagItems = result.warnings
    .filter((w) => !w.startsWith("⚫") && !isNoiseWarning(w))
    .map(stripSlugs)
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {/* 분석 기준 프로필 카드 */}
      {lifestyleMeta && (
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
          <p className="text-sm text-neutral-500">
            <span className="mr-1">{lifestyleMeta.emoji}</span>
            <span className="font-medium text-neutral-800">{lifestyleMeta.label}</span>
            {" 기준으로 분석했어요"}
          </p>
          {(result.job_category || result.career_stage) && (
            <p className="mt-1 text-xs text-neutral-400">
              {result.job_category && <span>{result.job_category}</span>}
              {result.job_category && result.career_stage && <span className="mx-1">·</span>}
              {result.career_stage && <span>{CAREER_STAGE_META[result.career_stage].label}</span>}
            </p>
          )}
        </div>
      )}

      {/* 라벨 + 종합 점수 */}
      <div className={`rounded-2xl border p-6 sm:p-8 text-center ${meta.bg} ${meta.border}`}>
        <span className="text-5xl">{meta.emoji}</span>
        <h2 className={`mt-4 text-2xl sm:text-3xl font-bold ${meta.color}`}>{result.label}</h2>
        <p className={`mt-2 font-mono text-3xl sm:text-4xl font-bold ${meta.color}`}>
          {result.composite_score}
          <span className="text-lg font-normal opacity-60">/ 100</span>
        </p>
      </div>

      {/* 디멘션 점수 */}
      <div className="rounded-xl border border-neutral-100 p-5">
        <h3 className="mb-3 text-sm font-medium text-neutral-700">항목별 점수</h3>
        <div className="space-y-3">
          {result.dimensions.map((d) =>
            d.confidence === 0 ? (
              <div key={d.dimension} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-neutral-500">
                  {DIMENSION_LABEL[d.dimension] ?? d.dimension}
                </span>
                <span className="text-xs text-neutral-400">— 스킬 미입력</span>
              </div>
            ) : (
              <div key={d.dimension} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-neutral-500">
                  {DIMENSION_LABEL[d.dimension] ?? d.dimension}
                </span>
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-700 transition-all"
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 text-right font-mono text-xs text-neutral-500">{d.score}</span>
              </div>
            ),
          )}
        </div>

        {result.dimensions.some((d) => d.confidence === 0) && (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm font-medium text-neutral-800">스킬 매칭 점수가 빠져있어요</p>
            <p className="mt-1 text-xs text-neutral-500">
              진단을 완료하고 로그인하면 내 스킬·경력·라이프스타일 기반으로 더 정확한 적합도를 받아볼 수 있어요.
            </p>
            <button
              onClick={async () => {
                const supabase = getBrowserClient();
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/auth/callback?next=/analyze` },
                });
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google로 로그인하고 정확한 매칭 받기
            </button>
          </div>
        )}
      </div>

      {/* 경고 — critical 인사이트 기반 위험 요인만 (⚫ 접두어) */}
      {result.warnings.some((w) => w.startsWith("⚫")) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h3 className="mb-3 text-sm font-medium text-red-700">⚠ 주요 위험 요인</h3>
          <ul className="space-y-1.5">
            {result.warnings
              .filter((w) => w.startsWith("⚫"))
              .map((w, i) => (
                <li key={i} className="text-sm leading-relaxed text-red-700">{w}</li>
              ))}
          </ul>
        </div>
      )}

      {/* 참고사항 */}
      {flagItems.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
          <h3 className="mb-3 text-sm font-medium text-amber-700">공고 인사이트</h3>
          <ul className="space-y-1.5">
            {flagItems.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-amber-700">
                <span className="mt-1 shrink-0">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 판단 근거 인사이트 */}
      {result.cited_insights.length > 0 && (() => {
        const positiveInsights = result.cited_insights.filter((i) => i.severity === "info");
        const cautionInsights = result.cited_insights.filter((i) => i.severity !== "info");
        const renderInsights = (items: typeof result.cited_insights) =>
          items.map((insight) => {
            const s = SEVERITY_STYLE[insight.severity];
            return (
              <div key={insight.id} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${s.badge}`}>
                    {SEVERITY_LABEL[insight.severity]}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{insight.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">{insight.content}</p>
                  </div>
                </div>
              </div>
            );
          });
        return (
          <div className="space-y-4">
            {positiveInsights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-700">긍정 요소</h3>
                {renderInsights(positiveInsights)}
              </div>
            )}
            {cautionInsights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-700">유의 사항</h3>
                {renderInsights(cautionInsights)}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
