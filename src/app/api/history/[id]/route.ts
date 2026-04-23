import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase-server";
import { getAdminClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const adminClient = getAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: existing, error: lookupError } = await adminClient
    .from("applications")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { error: "분석 기록 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json(
      { error: "삭제할 분석 기록을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const { error } = await adminClient
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "분석 기록 삭제 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id });
}
