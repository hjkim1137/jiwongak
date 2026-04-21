"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDiagnosisStore } from "@/lib/stores/diagnosis-store";
import { LIFESTYLE_TYPE_META } from "@/types/diagnosis";
import { getBrowserClient } from "@/lib/supabase";
import { saveProfile } from "@/lib/diagnosis/save-profile";
import type { DiagnosisAnswers } from "@/types/diagnosis";
type SaveStatus = "saving" | "saved" | "error" | "anonymous";

export default function DiagnosisResultPage() {
  const { result, jobCategory, careerStage, answers, reset } =
    useDiagnosisStore();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saving");
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

        setUserEmail(u.email ?? null);
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

  // 저장 완료 전까지는 스피너만 표시 — 카드+결과 동시 렌더로 깜빡임 제거
  if (!result || saveStatus === "saving") {
    return (
      <main className="flex min-h-screen items-center justify-center font-sans">
        {!result ? (
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <p className="text-neutral-500">진단 결과가 없습니다</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              진단하러 가기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
            <p className="text-sm text-neutral-400">결과 저장 중...</p>
          </div>
        )}
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

        {/* 저장 상태 (saved / error / anonymous) */}
        <div className="text-center text-sm">
          {saveStatus === "saved" && (
            <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-center">
              <p className="text-sm font-medium text-green-700">프로필 저장 완료</p>
              {userEmail && (
                <p className="mt-0.5 text-xs text-neutral-500">{userEmail}</p>
              )}
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                이제 공고를 분석하면 내 스킬·경력·라이프스타일 기준으로 적합도를 계산해드려요
              </p>
            </div>
          )}
          {saveStatus === "error" && (
            <span className="text-red-500">저장 중 오류가 발생했습니다</span>
          )}
          {saveStatus === "anonymous" && (
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-sm text-neutral-600">
                로그인하면 진단 결과가 저장되어 공고 분석에 활용됩니다
              </p>
              <button
                onClick={async () => {
                  const supabase = getBrowserClient();
                  await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: `${window.location.origin}/auth/callback?next=/diagnosis/result` },
                  });
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google로 로그인
              </button>
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
