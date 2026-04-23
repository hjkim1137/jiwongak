"use client";

import { useState, useRef, useEffect } from "react";
import type { AnalysisResult } from "@/types/analysis";
import { AnalysisResultPreview } from "./analysis-result-preview";
import { AnalysisProgress, type AnalysisStep } from "./analysis-progress";

const MIN_LENGTH = 50;
const URL_PATTERN = /^https?:\/\/\S+$/;

type SSEEvent =
  | { type: "progress"; step: AnalysisStep }
  | { type: "result"; data: AnalysisResult }
  | { type: "error"; error: string };

type State =
  | { phase: "idle" }
  | { phase: "loading"; step: AnalysisStep }
  | { phase: "success"; result: AnalysisResult }
  | { phase: "error"; message: string };

export function AnalyzeForm() {
  const [text, setText] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [state, setState] = useState<State>({ phase: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < MIN_LENGTH) return;
    if (URL_PATTERN.test(trimmed)) {
      setUrlError(true);
      return;
    }
    setUrlError(false);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState({ phase: "loading", step: "parsing" });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: trimmed }),
        signal: ctrl.signal,
      });

      // 사전 검증 실패 (400, 429) — 일반 JSON 응답
      if (!res.ok) {
        const err = await res.json();
        setState({
          phase: "error",
          message: err.error ?? "분석 중 오류가 발생했습니다",
        });
        return;
      }

      // SSE 스트림 읽기
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";

        for (const msg of messages) {
          if (!msg.startsWith("data: ")) continue;
          const event = JSON.parse(msg.slice(6)) as SSEEvent;

          if (event.type === "progress") {
            setState({ phase: "loading", step: event.step });
          } else if (event.type === "result") {
            setState({ phase: "success", result: event.data });
          } else if (event.type === "error") {
            setState({ phase: "error", message: event.error });
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setState({ phase: "error", message: "분석 중 오류가 발생했습니다" });
    }
  };

  const isLoading = state.phase === "loading";
  const isDisabled = text.trim().length < MIN_LENGTH || isLoading;

  return (
    <div className="w-full space-y-6">
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
            onChange={(e) => {
              setText(e.target.value);
              if (urlError) setUrlError(false);
            }}
            placeholder="채용공고 전문을 붙여넣어 주세요&#10;&#10;회사명, 직무 설명, 자격 요건, 우대 사항 등을 포함하면 더 정확한 분석이 가능합니다"
            rows={14}
            disabled={isLoading}
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
          {isLoading ? "분석 중..." : "분석하기"}
        </button>
      </form>

      {/* 단계 진행 표시 */}
      {isLoading && <AnalysisProgress step={state.step} />}

      {/* URL 입력 에러 */}
      {urlError && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
          링크는 분석할 수 없어요. 채용공고 전문(텍스트)을 복사해서 붙여넣어 주세요.
        </div>
      )}

      {/* 에러 */}
      {state.phase === "error" && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {state.message}
        </div>
      )}

      {/* 분석 결과 */}
      {state.phase === "success" && (
        <AnalysisResultPreview result={state.result} />
      )}
    </div>
  );
}
