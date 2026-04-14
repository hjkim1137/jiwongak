-- 0001_create_industry_insights.sql
-- 산업/직무 인사이트 RAG 테이블. 큐레이션 데이터 + Voyage voyage-3 임베딩(1024 dim).

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists industry_insights (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,                  -- 시드 재실행 시 upsert 키

  -- 매칭 스코프 (모두 nullable, 더 specific한 게 우선순위 높음)
  -- 매칭 매트릭스: industry × job_category × job_function
  industry         text,
  sub_industry     text,
  job_category     text,           -- '개발/엔지니어링', '디자인', '금융 전문직', '공공 전문직' 등 17개
  job_function     text,           -- 카테고리 내 세부 직무 ('프론트엔드', 'IB(투자은행)' 등)
  job_level        text check (job_level in ('core', 'minor') or job_level is null),

  -- 인사이트 본문
  insight_type     text not null check (insight_type in (
    'career_ceiling',
    'lockin_risk',
    'scarcity_value',
    'transferability',
    'growth_outlook',
    'culture_pattern',
    'compensation_pattern'
  )),
  severity         text not null check (severity in ('info', 'warn', 'critical')),
  title            text not null,
  content          text not null,

  -- 출처/검증
  evidence_urls    text[] default '{}',
  source_type      text check (source_type in (
    'official_data',
    'curated_analysis',
    'community_consensus'
  )),
  last_verified_at timestamptz default now(),

  -- 검색용 벡터 (Voyage voyage-3 → 1024 dim)
  embedding        vector(1024),

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- 메타데이터 필터 인덱스 (산업/직군/직무 사전 필터링 후 벡터 검색)
create index if not exists industry_insights_industry_job_idx
  on industry_insights (industry, job_function);

create index if not exists industry_insights_job_category_idx
  on industry_insights (job_category);

create index if not exists industry_insights_type_severity_idx
  on industry_insights (insight_type, severity);

-- 벡터 인덱스 (HNSW — 작은 데이터셋에서도 ivfflat보다 안정적)
create index if not exists industry_insights_embedding_idx
  on industry_insights using hnsw (embedding vector_cosine_ops);

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists industry_insights_updated_at on industry_insights;
create trigger industry_insights_updated_at
  before update on industry_insights
  for each row execute function set_updated_at();
