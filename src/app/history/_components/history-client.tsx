"use client";

import { useState } from "react";
import Link from "next/link";
import { AnalysisResultPreview, LABEL_META } from "@/app/analyze/_components/analysis-result-preview";
import type { ApplicationRow } from "../page";

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

function HistoryCard({ app }: { app: ApplicationRow }) {
  const [expanded, setExpanded] = useState(false);
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
        <div className="border-t border-neutral-100 px-5 py-5">
          <AnalysisResultPreview result={app.analysis_cache} />
        </div>
      )}
    </div>
  );
}

export function HistoryClient({ applications }: { applications: ApplicationRow[] }) {
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
    <div className="space-y-3">
      {applications.map((app) => (
        <HistoryCard key={app.id} app={app} />
      ))}
    </div>
  );
}
