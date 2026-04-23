"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AnalysisResultPreview, LABEL_META } from "@/app/analyze/_components/analysis-result-preview";
import { LIFESTYLE_TYPE_META } from "@/types/diagnosis";
import type { ApplicationRow } from "../page";
import type { Label, LifestyleType } from "@/types/analysis";

type SortKey = "latest" | "score";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-green-700 bg-green-50"
      : score >= 50
        ? "text-amber-700 bg-amber-50"
        : "text-neutral-600 bg-neutral-100";
  return (
    <span className={`font-mono text-sm font-semibold px-2 py-0.5 rounded-md ${color}`}>
      {score}
    </span>
  );
}

type CardTab = "result" | "posting";

function HistoryCard({ app }: { app: ApplicationRow }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<CardTab>("result");
  const meta = LABEL_META[app.label as keyof typeof LABEL_META];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <span className="text-xl shrink-0">{meta?.emoji ?? "📄"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-neutral-900 truncate">{app.company}</span>
            {app.is_stale && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 shrink-0">
                재분석 필요
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 truncate">
            {[app.job_category, app.job_function].filter(Boolean).join(" · ") || "직군 미분류"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <ScoreBadge score={app.match_score} />
          <span className="text-xs text-neutral-400">{formatDate(app.created_at)}</span>
        </div>
        <svg
          className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100">
          {/* 탭 */}
          <div className="flex border-b border-neutral-100 px-5">
            {(["result", "posting"] as CardTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2.5 pr-5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {t === "result" ? "분석 결과" : "공고 원문"}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="px-5 py-5">
            {tab === "result" ? (
              <AnalysisResultPreview result={app.analysis_cache} />
            ) : (
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-neutral-50 p-4 font-sans text-xs leading-relaxed text-neutral-700">
                {app.raw_text}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryClient({ applications }: { applications: ApplicationRow[] }) {
  const [selectedLabels, setSelectedLabels] = useState<Set<Label>>(new Set());
  const [selectedLifestyleTypes, setSelectedLifestyleTypes] = useState<Set<LifestyleType>>(new Set());
  const [sort, setSort] = useState<SortKey>("latest");

  const allLabels = Object.keys(LABEL_META) as Label[];

  const lifestyleTypes = useMemo(() => {
    const seen = new Set<LifestyleType>();
    applications.forEach((app) => {
      if (app.analysis_cache.lifestyle_type) seen.add(app.analysis_cache.lifestyle_type);
    });
    return [...seen];
  }, [applications]);

  const filtered = useMemo(() => {
    let result = [...applications];

    if (selectedLabels.size > 0) {
      result = result.filter((app) => selectedLabels.has(app.label as Label));
    }
    if (selectedLifestyleTypes.size > 0) {
      result = result.filter(
        (app) =>
          app.analysis_cache.lifestyle_type &&
          selectedLifestyleTypes.has(app.analysis_cache.lifestyle_type),
      );
    }

    result.sort((a, b) =>
      sort === "score"
        ? b.match_score - a.match_score
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return result;
  }, [applications, selectedLabels, selectedLifestyleTypes, sort]);

  const toggleLabel = (label: Label) => {
    setSelectedLabels((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const toggleLifestyleType = (type: LifestyleType) => {
    setSelectedLifestyleTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const hasActiveFilter = selectedLabels.size > 0 || selectedLifestyleTypes.size > 0;

  const resetFilters = () => {
    setSelectedLabels(new Set());
    setSelectedLifestyleTypes(new Set());
  };

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-4xl">📭</span>
        <p className="text-sm text-neutral-500">아직 분석한 공고가 없어요</p>
        <Link
          href="/analyze"
          className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          첫 공고 분석하기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 필터 패널 */}
      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
        {/* 레이블 필터 */}
        <div className="flex flex-wrap gap-2">
          {allLabels.map((label) => {
            const meta = LABEL_META[label];
            const isActive = selectedLabels.has(label);
            return (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-neutral-300 bg-neutral-200 text-neutral-900"
                    : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {meta.emoji} {label}
              </button>
            );
          })}
        </div>

        {/* 진단 프로필 필터 (히스토리에 2종 이상 존재할 때만) */}
        {lifestyleTypes.length > 1 && (
          <div>
            <p className="mb-2 text-xs font-medium text-neutral-400">진단 프로필</p>
            <div className="flex flex-wrap gap-2">
              {lifestyleTypes.map((type) => {
                const meta = LIFESTYLE_TYPE_META[type];
                const isActive = selectedLifestyleTypes.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleLifestyleType(type)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "border-neutral-300 bg-neutral-200 text-neutral-900"
                        : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    {meta.emoji} {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 정렬 */}
        <div className="flex justify-end border-t border-neutral-100 pt-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-600 focus:outline-none"
          >
            <option value="latest">최신순</option>
            <option value="score">점수 높은 순</option>
          </select>
        </div>
      </div>

      {/* 카운트 + 초기화 */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-neutral-500">
          <span className="font-semibold text-neutral-900">{filtered.length}</span>개
          {hasActiveFilter && (
            <span className="ml-1 text-neutral-400">/ 전체 {applications.length}개</span>
          )}
        </p>
        {hasActiveFilter && (
          <button
            onClick={resetFilters}
            className="text-xs text-neutral-400 transition-colors hover:text-neutral-700"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-neutral-400">조건에 맞는 공고가 없어요</p>
          <button
            onClick={resetFilters}
            className="mt-3 text-sm font-medium text-neutral-700 underline underline-offset-2"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <HistoryCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
