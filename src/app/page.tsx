import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 font-sans">
      <div className="text-center">
        <h1 className="text-4xl font-bold sm:text-6xl">지원각</h1>
        <p className="mt-2 font-mono text-sm text-gray-500">
          이 공고 지원각이야?
        </p>
      </div>
      <p className="max-w-md text-center text-sm text-gray-600">
        채용공고를 붙여넣으면 당신의 경력·역량·라이프스타일과 매칭해 지원
        적합도를 한 마디로 알려주는 AI 서비스
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/diagnosis"
          className="rounded-lg bg-neutral-900 px-8 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          진단 시작하기
        </Link>
        <Link
          href="/analyze"
          className="rounded-lg border border-neutral-300 px-8 py-3 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          공고 분석하기
        </Link>
      </div>
    </main>
  );
}
