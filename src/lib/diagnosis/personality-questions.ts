/**
 * P1~P6 성격 분석 문항 정의 (양자택일).
 *
 * 3축 × 2문항 구성:
 *  - stress_tolerance: P1, P2
 *  - sensitivity:      P3, P4
 *  - change_adaptability: P5, P6
 *
 * 톤 원칙(CLAUDE.md):
 *  - "양극 모두 강점" 프레임. high가 우월하지 않다.
 *  - 부정적/판단적 표현 금지 ("둔감", "불안" 등)
 *  - 옵션 라벨은 사용자가 강한 동의 없이도 자기 인식과 어울리는 쪽을 고를 수 있게 작성
 *
 * classify-personality는 옵션 점수의 high/low 누적 → pole 차이로 분류.
 */

import type { PersonalityQuestion } from "@/types/personality";

export const PERSONALITY_QUESTIONS: readonly PersonalityQuestion[] = [
  {
    id: "P1",
    axis: "stress_tolerance",
    theme: "마감·압박",
    prompt:
      "갑자기 일정이 당겨지거나 동시에 여러 마감이 겹친 상황에 더 가까운 반응은?",
    options: [
      {
        id: "A",
        label: "어수선하더라도 우선순위를 다시 짜고 그대로 진행한다",
        scores: { stress_tolerance: { high: 2 } },
      },
      {
        id: "B",
        label: "한 박자 쉬면서 정리된 일정으로 다시 협의하고 싶다",
        scores: { stress_tolerance: { low: 2 } },
      },
    ],
  },
  {
    id: "P2",
    axis: "stress_tolerance",
    theme: "회복",
    prompt: "고난도 이슈를 처리한 다음 날의 본인 컨디션에 더 가까운 쪽은?",
    options: [
      {
        id: "A",
        label: "다음 이슈로 비교적 빠르게 전환할 수 있다",
        scores: { stress_tolerance: { high: 2 } },
      },
      {
        id: "B",
        label:
          "회복 시간이 어느 정도 필요하고, 정비 후에 다음 일을 잡는 편이 낫다",
        scores: { stress_tolerance: { low: 2 } },
      },
    ],
  },
  {
    id: "P3",
    axis: "sensitivity",
    theme: "환경 자극",
    prompt: "팀 분위기·말투 변화·미세한 기류에 대한 본인의 감지 정도는?",
    options: [
      {
        id: "A",
        label: "비교적 빠르게 알아차리고, 작은 변화도 신경이 쓰이는 편",
        scores: { sensitivity: { high: 2 } },
      },
      {
        id: "B",
        label: "큰 변화가 아니면 일에 집중해서 잘 인지하지 못하는 편",
        scores: { sensitivity: { low: 2 } },
      },
    ],
  },
  {
    id: "P4",
    axis: "sensitivity",
    theme: "디테일",
    prompt: "산출물(문서/코드/디자인)에서 디테일을 다루는 본인의 성향은?",
    options: [
      {
        id: "A",
        label:
          "작은 어색함도 잘 보이고, 다듬어진 결과물에서 만족을 얻는 편",
        scores: { sensitivity: { high: 2 } },
      },
      {
        id: "B",
        label:
          "전체 흐름·핵심 결과가 맞으면 세부 다듬기에 큰 비중을 두지 않는 편",
        scores: { sensitivity: { low: 2 } },
      },
    ],
  },
  {
    id: "P5",
    axis: "change_adaptability",
    theme: "우선순위 전환",
    prompt:
      "상위 의사결정으로 진행 중이던 과제 방향이 절반쯤 바뀐 상황에 더 가까운 반응은?",
    options: [
      {
        id: "A",
        label: "맥락을 이해하면 새 방향에서 빠르게 다시 시작할 수 있다",
        scores: { change_adaptability: { high: 2 } },
      },
      {
        id: "B",
        label:
          "기존 작업 정리와 인수인계가 충분해야 새 방향에 진입할 수 있다",
        scores: { change_adaptability: { low: 2 } },
      },
    ],
  },
  {
    id: "P6",
    axis: "change_adaptability",
    theme: "신규 환경",
    prompt:
      "직무·도구·도메인이 한 번에 바뀌는 상황을 더 자연스럽게 받아들이는 쪽은?",
    options: [
      {
        id: "A",
        label: "새로운 환경 자체에서 학습 동기가 생기는 편",
        scores: { change_adaptability: { high: 2 } },
      },
      {
        id: "B",
        label: "한 환경에서 깊이 익숙해지는 편이 본인의 강점에 가까움",
        scores: { change_adaptability: { low: 2 } },
      },
    ],
  },
];

export const PERSONALITY_QUESTION_BY_ID = new Map(
  PERSONALITY_QUESTIONS.map((q) => [q.id, q]),
);
