import Link from "next/link";

function MockResultCard() {
  const dimensions = [
    { label: "스킬 매칭", score: 78 },
    { label: "워라밸", score: 85 },
    { label: "성장성", score: 90 },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-neutral-100 to-neutral-200 rotate-2" />
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-50 to-green-100 -rotate-1 opacity-60" />
      <div className="relative space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
        <div className="absolute -top-3 -right-3 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white shadow-md">
          AI 분석 결과
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
          <span className="text-4xl">✅</span>
          <h2 className="mt-2 text-xl font-bold text-green-700">지원각</h2>
          <p className="mt-1 font-mono text-3xl font-bold text-green-700">
            82
            <span className="text-base font-normal opacity-60"> / 100</span>
          </p>
        </div>

        <div className="rounded-xl border border-neutral-100 p-4">
          <p className="mb-3 text-xs font-medium text-neutral-700">항목별 점수</p>
          <div className="space-y-2.5">
            {dimensions.map(({ label, score }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-neutral-500">{label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-neutral-700"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-xs text-neutral-500">{score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">참고</span>
            <p className="text-xs leading-relaxed text-neutral-700">기술 스택이 현재 경력과 잘 매칭돼요</p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">주의</span>
            <p className="text-xs leading-relaxed text-neutral-700">초기 스타트업 특성상 워라밸 변동 가능성이 있어요</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 items-center font-sans">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-20">
        <div className="space-y-7 text-center lg:text-left">
          <div className="space-y-4">
            <p className="text-sm font-medium text-neutral-400">AI 채용공고 적합도 분석</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              이 공고,<br />지원각이야?
            </h1>
          </div>
          <p className="text-base leading-relaxed text-neutral-500 sm:text-lg">
            채용공고를 붙여넣으면 내 경력·역량·라이프스타일과 매칭해
            지원 적합도를 한 마디로 알려주는 AI 서비스
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/diagnosis"
              className="rounded-lg bg-neutral-900 px-8 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              진단 시작하기
            </Link>
            <Link
              href="/analyze"
              className="rounded-lg border border-neutral-300 px-8 py-3.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              공고 바로 분석하기
            </Link>
          </div>
        </div>

        <div className="px-4 lg:px-0">
          <MockResultCard />
        </div>
      </div>
    </main>
  );
}
