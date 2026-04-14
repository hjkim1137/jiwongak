/**
 * Supabase 클라이언트 팩토리.
 *
 * - 브라우저: @supabase/ssr의 createBrowserClient (쿠키 자동 관리)
 * - 서버(API Route/Server Component): createServerClient (쿠키 전달 필요)
 * - 서버 admin: service role key로 RLS 우회 (시드, 배치 작업)
 */

import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

/**
 * 브라우저용 Supabase 클라이언트 (anon key + RLS + 쿠키 자동).
 * 클라이언트 컴포넌트에서 사용.
 */
export function getBrowserClient() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return browserClient;
}

/**
 * 서버 admin 클라이언트 (service role key, RLS 우회).
 * API Route에서 시드/배치 등 admin 작업 시 사용.
 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않음",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
