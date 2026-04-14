/**
 * Supabase 클라이언트 (Day 2에서 마이그레이션·Auth 셋업 후 본격 사용).
 *
 * 환경변수 우선순위:
 *   - 클라이언트 컴포넌트: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (RLS 적용)
 *   - 서버 컴포넌트/API Route: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (RLS 우회 — admin 작업)
 *
 * 주의: service role key는 절대 클라이언트 번들에 포함되면 안 됨.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

/**
 * 브라우저용 Supabase 클라이언트 (anon key + RLS 적용).
 * 컴포넌트에서 사용.
 */
export function getBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않음",
    );
  }

  browserClient = createClient(url, anonKey);
  return browserClient;
}

/**
 * 서버용 Supabase 클라이언트 (service role key + RLS 우회).
 * API Route 또는 서버 컴포넌트에서만 사용. 절대 클라이언트로 노출 금지.
 */
export function getServerClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않음",
    );
  }

  // 서버 클라이언트는 매번 생성 (요청 격리)
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
