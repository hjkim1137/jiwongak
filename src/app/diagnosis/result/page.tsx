"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDiagnosisStore } from "@/lib/stores/diagnosis-store";
import { LIFESTYLE_TYPE_META } from "@/types/diagnosis";
import { getBrowserClient } from "@/lib/supabase";
import { saveProfile } from "@/lib/diagnosis/save-profile";
import type { DiagnosisAnswers } from "@/types/diagnosis";
type SaveStatus = "idle" | "saving" | "saved" | "error" | "anonymous";

export default function DiagnosisResultPage() {
  const { result, jobCategory, careerStage, answers, reset } =
    useDiagnosisStore();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // 로그인 확인 + 자동 저장
  useEffect(() => {
    if (!result || !jobCategory || !careerStage) return;

    async function checkAndSave() {
      try {
        const supabase = getBrowserClient();
        const {
          data: { user: u },
        } = await supabase.auth.getUser();

        if (!u) {
          setSaveStatus("anonymous");
          return;
        }

        setSaveStatus("saving");
        const res = await saveProfile({
          userId: u.id,
          jobCategory: jobCategory!,
          careerStage: careerStage!,
          answers: answers as DiagnosisAnswers,
          result: result!,
        });
        setSaveStatus(res.success ? "saved" : "error");
      } catch {
        // Supabase 미설정 또는 네트워크 오류 → 비회원 취급
        setSaveStatus("anonymous");
      }
    }

    checkAndSave();
  }, [result, jobCategory, careerStage, answers]);

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center font-sans">
        <div className="text-center">
          <p className="text-neutral-500">진단 결과가 없습니다</p>
          <Link
            href="/diagnosis"
            className="mt-4 inline-block text-sm text-neutral-900 underline"
          >
            진단하러 가기
          </Link>
        </div>
      </main>
    );
  }

  const meta = LIFESTYLE_TYPE_META[result.lifestyleType];

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12 font-sans">
      <div className="w-full max-w-lg space-y-8">
        {/* 타입 카드 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <span className="text-5xl">{meta.emoji}</span>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">
            {meta.label}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            {meta.summary}
          </p>
        </div>

        {/* 저장 상태 — idle(확인 중)은 표시 없음 → 깜빡임 방지 */}
        <div className="text-center text-sm">
          {saveStatus === "saving" && (
            <span className="text-neutral-400">프로필 저장 중...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-green-600">프로필이 저장되었습니다</span>
          )}
          {saveStatus === "error" && (
            <span className="text-red-500">저장 중 오류가 발생했습니다</span>
          )}
          {saveStatus === "anonymous" && (
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-neutral-500">
                로그인하면 진단 결과가 저장되어 공고 분석에 활용됩니다
              </p>
              <Link
                href="/login"
                className="mt-2 inline-block text-sm font-medium text-neutral-900 underline"
              >
                Google로 로그인
              </Link>
            </div>
          )}
        </div>

        {/* 요약 정보 */}
        <div className="rounded-xl bg-neutral-50 p-5 text-sm text-neutral-600">
          <div className="flex justify-between">
            <span>직군</span>
            <span className="font-medium text-neutral-900">{jobCategory}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>경력</span>
            <span className="font-medium text-neutral-900">
              {careerStage === "entry"
                ? "신입"
                : careerStage === "junior"
                  ? "주니어"
                  : "시니어"}
            </span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>top1-top2 gap</span>
            <span className="font-medium text-neutral-900">
              {result.topGap}
            </span>
          </div>
        </div>

        {/* 타입별 점수 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-neutral-700">타입별 점수</h3>
          {Object.entries(result.typeScores)
            .sort(([, a], [, b]) => b - a)
            .map(([type, score]) => {
              const typeMeta =
                LIFESTYLE_TYPE_META[type as keyof typeof LIFESTYLE_TYPE_META];
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="w-5 text-center">{typeMeta.emoji}</span>
                  <span className="w-32 truncate text-xs text-neutral-500">
                    {typeMeta.label}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-700 transition-all"
                        style={{
                          width: `${Math.min((score / 14) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-6 text-right font-mono text-xs text-neutral-500">
                    {score}
                  </span>
                </div>
              );
            })}
        </div>

        {/* 가중치 프리셋 */}
        <div className="rounded-xl border border-neutral-100 p-5">
          <h3 className="text-sm font-medium text-neutral-700">
            분석 가중치 프리셋
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            공고 분석 시 이 비율로 점수가 산출됩니다
          </p>
          <div className="mt-3 flex gap-2">
            {Object.entries(result.weightsPreset).map(([dim, weight]) => (
              <div
                key={dim}
                className="flex-1 rounded-lg bg-neutral-50 p-3 text-center"
              >
                <div className="text-xs text-neutral-500">
                  {dim === "skill_match"
                    ? "스킬"
                    : dim === "wlb"
                      ? "WLB"
                      : "성장성"}
                </div>
                <div className="mt-1 text-lg font-bold text-neutral-900">
                  {Math.round(weight * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 */}
        <div className="flex gap-3">
          <Link
            href="/analyze"
            className="flex-1 rounded-lg bg-neutral-900 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            공고 분석하기
          </Link>
          <button
            onClick={() => {
              reset();
              window.location.href = "/diagnosis";
            }}
            className="rounded-lg border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            다시 하기
          </button>
        </div>
      </div>
    </main>
  );
}
