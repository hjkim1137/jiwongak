-- 0002_create_profiles_and_applications.sql
-- 사용자 프로필, 스킬, 공고 분석 결과 테이블.

-- ============================================================
-- profiles: 사용자 배경 + 진단 결과 (라이프스타일 타입/가중치)
-- ============================================================
create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,

  -- 배경 정보
  career_years     smallint,
  current_position text,

  -- 진단 결과
  lifestyle_type   text check (lifestyle_type in (
    'njob_lifer', 'growth_challenger', 'jumper',
    'stable_wlb', 'founder_to_be', 'balanced'
  )),
  diagnosis_answers jsonb,           -- Q0~Q8 원본 답변 보관 (재진단 시 비교)

  -- 직군 (Q0에서 선택)
  job_category     text,             -- '개발/엔지니어링', '디자인' 등 17개

  -- 매칭용 요약 + 임베딩
  summary_text     text,             -- 프로필 요약 (프롬프트 캐싱용)
  embedding        vector(1024),     -- Voyage voyage-3

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table profiles enable row level security;

create policy "본인 프로필 조회"
  on profiles for select using (auth.uid() = id);

create policy "본인 프로필 수정"
  on profiles for update using (auth.uid() = id);

create policy "본인 프로필 생성"
  on profiles for insert with check (auth.uid() = id);

-- ============================================================
-- skills: 사용자 보유 스킬 (매칭 근거 출력에 사용)
-- ============================================================
create table if not exists skills (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,

  category         text not null check (category in (
    'frontend', 'backend', 'mobile', 'infra', 'domain', 'soft'
  )),
  name             text not null,           -- 'React', 'Spring Boot', 'BLE 통신' 등
  level            smallint check (level between 1 and 5),
  years            smallint,
  evidence         text,                    -- 어떤 프로젝트에서 썼는지

  created_at       timestamptz default now()
);

alter table skills enable row level security;

create policy "본인 스킬 조회"
  on skills for select using (auth.uid() = user_id);

create policy "본인 스킬 수정"
  on skills for all using (auth.uid() = user_id);

-- ============================================================
-- applications: 공고 분석 결과 캐시
-- ============================================================
create table if not exists applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,

  -- 공고 원문 + 파싱 결과
  raw_text         text not null,
  raw_text_hash    text not null,            -- 동일 공고 중복 분석 방지
  company          text,
  industry         text,
  sub_industry     text,
  job_category     text,
  job_function     text,
  extracted_requirements jsonb,              -- parsePosting 결과
  posting_embedding vector(1024),            -- Voyage

  -- 분석 결과
  match_score      smallint check (match_score between 0 and 100),
  label            text check (label in (
    '지원각', '고민각', '애매각', '패스각', '함정각'
  )),
  analysis_cache   jsonb,                    -- AnalysisResult 전체 JSON

  -- 재계산 플래그
  is_stale         boolean default false,    -- 프로필 변경 시 true

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table applications enable row level security;

create policy "본인 분석 조회"
  on applications for select using (auth.uid() = user_id);

create policy "본인 분석 생성"
  on applications for insert with check (auth.uid() = user_id);

create policy "본인 분석 수정"
  on applications for update using (auth.uid() = user_id);

-- 동일 사용자 + 동일 공고 중복 방지
create unique index if not exists applications_user_hash_idx
  on applications (user_id, raw_text_hash);

-- 재계산 큐 조회용
create index if not exists applications_stale_idx
  on applications (is_stale) where is_stale = true;

-- updated_at 트리거 재활용 (0001에서 생성한 set_updated_at 함수)
drop trigger if exists applications_updated_at on applications;
create trigger applications_updated_at
  before update on applications
  for each row execute function set_updated_at();

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- industry_insights에 전체 공개 RLS 정책 추가
-- (0001에서 테이블만 생성, RLS 정책은 여기서)
-- ============================================================
alter table industry_insights enable row level security;

create policy "인사이트 전체 공개 조회"
  on industry_insights for select using (true);
