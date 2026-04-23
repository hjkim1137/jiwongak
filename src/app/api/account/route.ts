import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase-server";
import { getAdminClient } from "@/lib/supabase";

export async function DELETE() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const adminClient = getAdminClient();

  // auth.users 삭제 → profiles → user_skills / applications 까지 CASCADE 정리
  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[account/DELETE] deleteUser failed:", error);
    return NextResponse.json(
      { error: "계정 삭제 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
