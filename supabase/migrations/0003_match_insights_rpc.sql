-- 0003_match_insights_rpc.sql
-- 공고 분석 시 관련 인사이트를 벡터 유사도로 검색하는 RPC.
-- 메타필터(산업/직군/직무) + cosine similarity 결합.

create or replace function match_insights(
  query_embedding vector(1024),
  target_industry text,
  target_job_category text,
  target_job_function text,
  match_count int default 15
)
returns table (
  id uuid,
  slug text,
  industry text,
  sub_industry text,
  job_category text,
  job_function text,
  job_level text,
  insight_type text,
  severity text,
  title text,
  content text,
  evidence_urls text[],
  similarity float
)
language sql stable
as $$
  select
    i.id, i.slug, i.industry, i.sub_industry,
    i.job_category, i.job_function, i.job_level,
    i.insight_type, i.severity, i.title, i.content,
    i.evidence_urls,
    1 - (i.embedding <=> query_embedding) as similarity
  from industry_insights i
  where
    -- 후보 추출: 산업/직군/직무 중 하나라도 일치 또는 모두 NULL(전체 적용)
    (i.industry is null and i.job_category is null and i.job_function is null)
    or i.industry = target_industry
    or i.job_category = target_job_category
    or i.job_function = target_job_function
  order by i.embedding <=> query_embedding
  limit match_count;
$$;
