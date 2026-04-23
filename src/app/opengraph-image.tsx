import { ImageResponse } from "next/og";

export const alt = "지원각 — 이 공고 지원각이야?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(): Promise<ArrayBuffer> {
  const text =
    "지원각이공고야?채용붙여넣으면경력역량라이프스타일기준적합도분석AI서비스결과스킬매칭워라밸성장";
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&text=${encodeURIComponent(text)}&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    }
  ).then((r) => r.text());

  const fontUrl = css.match(/src: url\((.+?)\) format\('woff2'\)/)?.[1];
  if (!fontUrl) throw new Error("Font URL not found");
  return fetch(fontUrl).then((r) => r.arrayBuffer());
}

export default async function Image() {
  const font = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          background: "#171717",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"Noto Sans KR"',
          padding: "80px",
          position: "relative",
        }}
      >
        {/* 배지 */}
        <div
          style={{
            background: "#262626",
            border: "1px solid #404040",
            borderRadius: "8px",
            padding: "8px 20px",
            color: "#a3a3a3",
            fontSize: "20px",
            marginBottom: "32px",
            display: "flex",
          }}
        >
          AI 채용공고 적합도 분석
        </div>

        {/* 메인 타이틀 */}
        <div
          style={{
            color: "#ffffff",
            fontSize: "76px",
            fontWeight: 700,
            letterSpacing: "-1px",
            marginBottom: "20px",
            display: "flex",
          }}
        >
          이 공고, 지원각이야?
        </div>

        {/* 서브 설명 */}
        <div
          style={{
            color: "#737373",
            fontSize: "22px",
            marginBottom: "56px",
            display: "flex",
            textAlign: "center",
          }}
        >
          채용공고를 붙여넣으면 경력·역량·라이프스타일 기준으로 적합도를
          분석해드려요
        </div>

        {/* 스코어 카드 */}
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "20px",
            padding: "24px 56px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div style={{ fontSize: "30px", display: "flex" }}>✅</div>
          <div
            style={{
              color: "#15803d",
              fontSize: "26px",
              fontWeight: 700,
              display: "flex",
            }}
          >
            지원각
          </div>
          <div
            style={{
              color: "#15803d",
              fontSize: "48px",
              fontWeight: 700,
              display: "flex",
              alignItems: "flex-end",
              gap: "4px",
            }}
          >
            82
            <span
              style={{ fontSize: "22px", opacity: 0.6, marginBottom: "10px" }}
            >
              / 100
            </span>
          </div>
        </div>

        {/* 브랜드명 */}
        <div
          style={{
            position: "absolute",
            bottom: "44px",
            right: "80px",
            color: "#525252",
            fontSize: "22px",
            fontWeight: 700,
            display: "flex",
          }}
        >
          지원각
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Noto Sans KR", data: font, weight: 700 }],
    }
  );
}
