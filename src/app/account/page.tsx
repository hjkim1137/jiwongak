import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase-server";
import { LogoutButton } from "./_components/logout-button";
import { DeleteAccountButton } from "./_components/delete-account-button";

export default async function AccountPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account");

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8 sm:py-12 font-sans">
      <div className="w-full max-w-2xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          홈
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-neutral-900">계정</h1>
          <p className="mt-1 text-sm text-neutral-500">
            로그인 정보를 확인하고 계정을 관리합니다
          </p>
        </div>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              로그인 정보
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Google 계정으로 연동됨
            </p>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-neutral-500">이메일</dt>
              <dd className="font-medium text-neutral-900 truncate">
                {user.email ?? "-"}
              </dd>
            </div>
          </dl>
          <div className="pt-2">
            <LogoutButton />
          </div>
        </section>

        <section className="rounded-2xl border border-red-200 bg-white p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-red-700">회원 탈퇴</h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              탈퇴 시 진단 프로필과 모든 분석 기록이 즉시 삭제됩니다. 이
              작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <DeleteAccountButton />
        </section>

        <p className="text-xs leading-relaxed text-neutral-400">
          Google 측의 앱 연동 자체를 해제하려면 Google 계정 설정 → 보안 → 타사
          앱 연동에서 별도로 진행해주세요.
        </p>
      </div>
    </main>
  );
}
