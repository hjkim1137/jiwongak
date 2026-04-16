/**
 * 진단 결과를 profiles 테이블에 저장 (upsert).
 *
 * - 브라우저 클라이언트 사용 (RLS: auth.uid() = id)
 * - 기존 프로필이 있으면 업데이트 (재진단)
 * - 비회원은 호출하지 않음 (caller에서 분기)
 */

import { getBrowserClient } from "@/lib/supabase";
import type { CareerStage, DiagnosisAnswers } from "@/types/diagnosis";
import type { DiagnosisResult } from "@/types/diagnosis";
import type { JobCategory } from "@/types/analysis";

const CAREER_STAGE_TO_YEARS: Record<CareerStage, number> = {
  entry: 0,
  junior: 1,
  senior: 4,
};

type SaveProfileParams = {
  userId: string;
  jobCategory: JobCategory;
  careerStage: CareerStage;
  answers: DiagnosisAnswers;
  result: DiagnosisResult;
};

export async function saveProfile({
  userId,
  jobCategory,
  careerStage,
  answers,
  result,
}: SaveProfileParams): Promise<{ success: boolean; error?: string }> {
  const supabase = getBrowserClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      job_category: jobCategory,
      career_years: CAREER_STAGE_TO_YEARS[careerStage],
      lifestyle_type: result.lifestyleType,
      diagnosis_answers: {
        q0: { jobCategory, careerStage },
        answers,
      },
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("[saveProfile] Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
