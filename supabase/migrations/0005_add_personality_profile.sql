-- 0005_add_personality_profile.sql
-- profiles 테이블에 성격 분석(PersonalityProfile) 컬럼 추가.
--
-- 진단 P1~P6 → classifyPersonality → axisScores + classification.
-- 매칭 4번째 차원 personality_fit 채점 시 scoreDimensions가 이 컬럼을 참조한다.
-- diagnosis_answers jsonb에는 personality_answers 키로 원본 답변도 함께 보관.
--
-- 동시에 가중치 프리셋이 4차원으로 재정규화되므로 기존 분석 결과는
-- composite_score가 변동될 수 있다 → applications.is_stale 일괄 true로 강제하여
-- 다음 조회 시 재계산하도록 한다.

alter table profiles
  add column if not exists personality_profile jsonb;

-- 4차원 재정규화에 따른 기존 분석 결과 재계산 강제
update applications set is_stale = true where is_stale = false;
