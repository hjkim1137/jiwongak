"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AnalysisResult } from "@/types/analysis";
import { AnalysisResultPreview } from "./analysis-result-preview";

const MIN_LENGTH = 50;
const URL_PATTERN = /^https?:\/\/\S+$/;

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
  const [urlError, setUrlError] = useState(false);

  const mutation = useMutation({ mutationFn: fetchAnalysis });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < MIN_LENGTH) return;
    if (URL_PATTERN.test(trimmed)) {
      setUrlError(true);
      return;
    }
    setUrlError(false);
    mutation.mutate(trimmed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (urlError) setUrlError(false);
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
            onChange={handleChange}
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
          className="w-full cursor-pointer rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending ? "분석 중..." : "분석하기"}
        </button>
      </form>

      {/* 분석 중 상태 */}
      {mutation.isPending && (
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
          <p className="text-sm font-medium text-neutral-700">공고 분석 중</p>
        </div>
      )}

      {/* URL 입력 에러 */}
      {urlError && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
          링크는 분석할 수 없어요. 채용공고 전문(텍스트)을 복사해서 붙여넣어 주세요.
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
