"use client";

import { useDiagnosisStore } from "@/lib/stores/diagnosis-store";
import { JOB_CATEGORIES, type JobCategory } from "@/types/analysis";
import {
  CAREER_STAGES,
  CAREER_STAGE_META,
  type CareerStage,
} from "@/types/diagnosis";

export function StepQ0() {
  const { jobCategory, careerStage, setQ0 } = useDiagnosisStore();

  const handleJobCategory = (value: string) => {
    const jc = value as JobCategory;
    if (careerStage) setQ0(jc, careerStage);
    else
      useDiagnosisStore.setState({ jobCategory: jc });
  };

  const handleCareerStage = (stage: CareerStage) => {
    if (jobCategory) setQ0(jobCategory, stage);
    else
      useDiagnosisStore.setState({ careerStage: stage });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">
          먼저 기본 정보를 알려주세요
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          직군과 경력 구간에 맞춰 진단을 맞춤화합니다
        </p>
      </div>

      {/* 직군 선택 */}
      <div className="space-y-2">
        <label
          htmlFor="job-category"
          className="text-sm font-medium text-neutral-700"
        >
          직군
        </label>
        <select
          id="job-category"
          value={jobCategory ?? ""}
          onChange={(e) => handleJobCategory(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 transition-colors focus:border-neutral-500 focus:outline-none"
        >
          <option value="" disabled>
            직군을 선택하세요
          </option>
          {JOB_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 경력 구간 선택 */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-neutral-700">경력 구간</span>
        <div className="grid grid-cols-3 gap-3">
          {CAREER_STAGES.map((stage) => {
            const meta = CAREER_STAGE_META[stage];
            const selected = careerStage === stage;
            return (
              <button
                key={stage}
                onClick={() => handleCareerStage(stage)}
                className={`rounded-lg border-2 px-3 py-3 text-center text-sm font-medium transition-all ${
                  selected
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {meta.short}
                <span className="mt-0.5 block text-xs font-normal opacity-70">
                  {stage === "entry"
                    ? "0년"
                    : stage === "junior"
                      ? "1~3년"
                      : "4년+"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
