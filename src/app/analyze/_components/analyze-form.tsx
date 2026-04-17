"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AnalysisResult, Label, Severity } from "@/types/analysis";

const MIN_LENGTH = 50;

const LABEL_META: Record<
  Label,
  { emoji: string; color: string; bg: string; border: string }
> = {
  지원각: {
    emoji: "✅",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  고민각: {
    emoji: "🤔",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  애매각: {
    emoji: "😐",
    color: "text-neutral-600",
    bg: "bg-neutral-50",
    border: "border-neutral-200",
  },
  패스각: {
    emoji: "⚠️",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  함정각: {
    emoji: "⚫",
    color: "text-white",
    bg: "bg-neutral-900",
    border: "border-neutral-900",
  },
};

const DIMENSION_LABEL: Record<string, string> = {
  skill_match: "스킬 매칭",
  wlb: "워라밸",
  career_ceiling: "성장성",
};

const SEVERITY_STYLE: Record<Severity, { badge: string; border: string; bg: string }> = {
  info:     { badge: "bg-blue-100 text-blue-700",   border: "border-blue-100",   bg: "bg-blue-50"   },
  warn:     { badge: "bg-amber-100 text-amber-700", border: "border-amber-200",  bg: "bg-amber-50"  },
  critical: { badge: "bg-red-100 text-red-700",     border: "border-red-200",    bg: "bg-red-50"    },
};

const SEVERITY_LABEL: Record<Severity, string> = {
  info: "참고",
  warn: "주의",
  critical: "위험",
};

async function fetchAnalysis(rawText: string): Promise<AnalysisResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawText }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "분석 중 오류가 발생했습니다");
  }
  return res.json();
}

export function AnalyzeForm() {
  const [text, setText] = useState("");

  const mutation = useMutation({ mutationFn: fetchAnalysis });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < MIN_LENGTH) return;
    mutation.mutate(trimmed);
  };

  const isDisabled = text.trim().length < MIN_LENGTH || mutation.isPending;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="posting"
            className="mb-2 block text-sm font-medium text-neutral-700"
          >
            채용공고
          </label>
          <textarea
            id="posting"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="채용공고 전문을 붙여넣어 주세요&#10;&#10;회사명, 직무 설명, 자격 요건, 우대 사항 등을 포함하면 더 정확한 분석이 가능합니다"
            rows={14}
            disabled={mutation.isPending}
            className="w-full resize-y rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-50"
          />
          <div className="mt-1 flex justify-between text-xs text-neutral-400">
            <span>
              {text.trim().length < MIN_LENGTH && text.length > 0
                ? `${MIN_LENGTH - text.trim().length}자 더 입력하세요`
                : ""}
            </span>
            <span>{text.length.toLocaleString()}자</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending ? "분석 중..." : "지원각 분석하기"}
        </button>
      </form>

      {/* 분석 중 상태 */}
      {mutation.isPending && (
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
          <p className="text-sm font-medium text-neutral-700">공고 분석 중</p>
          <p className="mt-1 text-xs text-neutral-400">
            공고 파싱 → 인사이트 검색 → AI 스코어링 순서로 처리합니다
          </p>
          <p className="mt-1 text-xs text-neutral-400">보통 10~20초 소요됩니다</p>
        </div>
      )}

      {/* 에러 */}
      {mutation.isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {mutation.error.message}
        </div>
      )}

      {/* 분석 결과 */}
      {mutation.isSuccess && mutation.data && (
        <AnalysisResultPreview result={mutation.data} />
      )}
    </div>
  );
}

function AnalysisResultPreview({ result }: { result: AnalysisResult }) {
  const meta = LABEL_META[result.label];

  return (
    <div className="space-y-4">
      {/* 라벨 + 종합 점수 */}
      <div
        className={`rounded-2xl border p-8 text-center ${meta.bg} ${meta.border}`}
      >
        <span className="text-5xl">{meta.emoji}</span>
        <h2 className={`mt-4 text-3xl font-bold ${meta.color}`}>
          {result.label}
        </h2>
        <p className={`mt-2 font-mono text-4xl font-bold ${meta.color}`}>
          {result.composite_score}
          <span className="text-lg font-normal opacity-60">/ 100</span>
        </p>
      </div>

      {/* 디멘션 점수 */}
      <div className="rounded-xl border border-neutral-100 p-5">
        <h3 className="mb-3 text-sm font-medium text-neutral-700">
          항목별 점수
        </h3>
        <div className="space-y-3">
          {result.dimensions.map((d) =>
            d.confidence === 0 ? (
              <div key={d.dimension} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-neutral-500">
                  {DIMENSION_LABEL[d.dimension] ?? d.dimension}
                </span>
                <span className="text-xs text-neutral-400">
                  프로필 필요 — 진단 완료 후 측정 가능
                </span>
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
                <span className="w-8 text-right font-mono text-xs text-neutral-500">
                  {d.score}
                </span>
              </div>
            ),
          )}
        </div>

        {/* 프로필 없는 경우 CTA */}
        {result.dimensions.some((d) => d.confidence === 0) && (
          <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500">
            스킬 매칭은 진단을 완료하고 로그인하면 내 프로필 기반으로 분석됩니다.{" "}
            <a href="/diagnosis" className="font-medium text-neutral-900 underline">
              진단 시작하기 →
            </a>
          </div>
        )}
      </div>

      {/* 경고 (warnings) — 함정각·패스각 주요 이슈 */}
      {result.warnings.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h3 className="mb-3 text-sm font-medium text-red-700">⚠ 주요 위험 요인</h3>
          <ul className="space-y-1.5">
            {result.warnings.map((w, i) => (
              <li key={i} className="text-sm leading-relaxed text-red-700">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 판단 근거 인사이트 */}
      {result.cited_insights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-neutral-700">이 분석의 근거</h3>
          {result.cited_insights.map((insight) => {
            const s = SEVERITY_STYLE[insight.severity];
            return (
              <div
                key={insight.id}
                className={`rounded-xl border p-4 ${s.bg} ${s.border}`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${s.badge}`}
                  >
                    {SEVERITY_LABEL[insight.severity]}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {insight.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                      {insight.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 다른 공고 분석 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-full rounded-lg border border-neutral-300 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
      >
        다른 공고 분석하기
      </button>
    </div>
  );
}
