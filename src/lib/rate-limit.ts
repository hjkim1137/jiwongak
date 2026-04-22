import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Upstash 환경변수가 없으면 (로컬 dev 등) rate limit 스킵
function createLimiters() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });

  return {
    // 비회원: 1시간 10회
    anonymous: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "rl:anon",
    }),
    // 로그인 사용자: 하루 50회
    user: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
      prefix: "rl:user",
    }),
  };
}

const limiters = createLimiters();

export async function checkRateLimit(
  userId?: string,
  ip?: string,
): Promise<{ success: boolean; retryAfter?: number }> {
  if (!limiters) return { success: true };

  const identifier = userId ?? ip ?? "unknown";
  const limiter = userId ? limiters.user : limiters.anonymous;

  const { success, reset } = await limiter.limit(identifier);
  return {
    success,
    retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
  };
}
