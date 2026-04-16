/**
 * Q1~Q8 진단 문항 정의 (양자택일)
 *
 * 각 선택지가 6타입(`LifestyleType`)에 점수를 부여한다.
 * `classifyType`에서 누적 점수 최댓값으로 타입을 결정한다.
 *
 * 설계 원칙:
 * - 문항당 2개 이상 타입이 가산되도록 하되, A/B 중 하나에만 쏠리지 않게 분산
 * - 공개 저장소이므로 자극적/판단적 문구는 피하고 중립 톤으로 작성 (CLAUDE.md 톤 원칙)
 * - "양자택일" 문항이라도 답변자가 동의하는 쪽이 없을 수 있으므로 balanced fallback 존재 (classifyType에서 처리)
 */

import type { Question } from "@/types/diagnosis";

export const QUESTIONS: readonly Question[] = [
  {
    id: "Q1",
    theme: "업무 외 시간 활용",
    prompt: "퇴근 이후의 시간에 대해 더 공감되는 쪽은?",
    options: [
      {
        id: "A",
        label: "개인 프로젝트·학습·수익원 다각화에 쓰고 싶다",
        scores: { njob_lifer: 2, founder_to_be: 1 },
      },
      {
        id: "B",
        label: "온전히 쉬거나 개인 생활에 집중하고 싶다",
        scores: { stable_wlb: 2 },
      },
    ],
  },
  {
    id: "Q2",
    theme: "보상과 안정성",
    prompt: "다음 이직/입사에서 더 우선하고 싶은 것은?",
    options: [
      {
        id: "A",
        label: "연봉·직급의 상승폭이 큰 조직",
        scores: { jumper: 2, growth_challenger: 1 },
      },
      {
        id: "B",
        label: "고용 안정성과 예측 가능한 업무량",
        scores: { stable_wlb: 2 },
      },
    ],
  },
  {
    id: "Q3",
    theme: "조직 규모·단계",
    prompt: "더 잘 맞을 것 같은 조직 단계는?",
    options: [
      {
        id: "A",
        label: "의사결정 반경이 넓은 초기/성장기 스타트업",
        scores: { founder_to_be: 2, growth_challenger: 1 },
      },
      {
        id: "B",
        label: "프로세스가 잡혀 있는 중견·대기업/공공",
        scores: { stable_wlb: 2 },
      },
    ],
  },
  {
    id: "Q4",
    theme: "재직 기간 선호",
    prompt: "한 조직에서 머무는 기간은 어느 쪽이 더 자연스러운가?",
    options: [
      {
        id: "A",
        label: "2~3년 주기로 새로운 조직에서 경험을 쌓는다",
        scores: { jumper: 2, growth_challenger: 1 },
      },
      {
        id: "B",
        label: "5년 이상 한 조직에서 깊게 성장한다",
        scores: { stable_wlb: 2 },
      },
    ],
  },
  {
    id: "Q5",
    theme: "업무 강도와 성장 속도",
    prompt: "업무 강도에 대한 감정에 더 가까운 쪽은?",
    options: [
      {
        id: "A",
        label: "성장 속도를 위해 일시적 야근·몰입은 수용할 수 있다",
        // Q5는 growth_challenger의 시그니처 문항이라 가중을 높여 jumper와의 동점 방지
        scores: { growth_challenger: 3, founder_to_be: 1 },
      },
      {
        id: "B",
        label: "정시 퇴근이 기본이어야 지속 가능하다",
        scores: { stable_wlb: 2, njob_lifer: 1 },
      },
    ],
  },
  {
    id: "Q6",
    theme: "수입 구조",
    prompt: "바라는 수입 구조에 더 가까운 쪽은?",
    options: [
      {
        id: "A",
        label: "본업 외에도 수익 파이프라인을 여러 개 만들고 싶다",
        scores: { njob_lifer: 2, founder_to_be: 1 },
      },
      {
        id: "B",
        label: "본업 한 곳에서 최대한의 성장·보상을 집중적으로 추구한다",
        scores: { growth_challenger: 1, jumper: 1, stable_wlb: 1 },
      },
    ],
  },
  {
    id: "Q7",
    theme: "리스크 선호",
    prompt: "커리어에서의 리스크를 다룰 때 더 끌리는 쪽은?",
    options: [
      {
        id: "A",
        label: "불확실성이 있어도 상승 여력이 큰 선택",
        scores: { founder_to_be: 2, growth_challenger: 1, jumper: 1 },
      },
      {
        id: "B",
        label: "상승 여력이 완만해도 손실이 적은 선택",
        scores: { stable_wlb: 2 },
      },
    ],
  },
  {
    id: "Q8",
    theme: "자기 정의 기준",
    prompt: "본인 커리어의 성공을 가늠할 때 더 중요한 축은?",
    options: [
      {
        id: "A",
        label: "직급·연봉·타이틀 같은 객관 지표의 상승",
        scores: { jumper: 2, growth_challenger: 1 },
      },
      {
        id: "B",
        label: "자율성·내 제품/사업·장기적 독립성",
        scores: { founder_to_be: 2, njob_lifer: 1 },
      },
    ],
  },
];

/**
 * 동일 순서 배열을 O(1) 조회용으로 Map 화.
 * classifyType에서 answer[questionId]를 빠르게 매핑하는 데 사용.
 */
export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));
