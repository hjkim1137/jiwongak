# 지원각 (Jiwongak)

> **이 공고 지원각이야?** — 채용공고를 붙여넣으면 나의 경력·역량·라이프스타일과 매칭해 지원 적합도를 한 마디로 알려드립니다

🔗 **라이브 데모**: [jiwongak.vercel.app](https://jiwongak.vercel.app)

---

## 왜 만들었나

구직자는 적합도를 모른 채 무차별 지원합니다. 기존 매칭 서비스(원티드 AI매칭 등)는 키워드 매칭 위주이고, **산업·직무의 구조적 특성(커리어 천장, 락인 리스크, 희소성)을 알려주지 않습니다.**

지원각은 단순 적합도뿐 아니라 "이 공고는 SI 계열이라 이직 시장 가치가 낮습니다" 같은 **구조적 인사이트**를 함께 제공합니다.

---

## 핵심 기능

### 1. 8문항 진단 → 라이프스타일 타입 자동 분류
강제 양자택일 8문항으로 6개 타입(워라밸+사이드 양립형·성장형 도전자·이직 점프형·안정·WLB 중시·창업 지향·균형형) 중 하나를 자동 분류합니다.
사용자는 **가중치 슬라이더를 건드리지 않습니다** — 타입별로 사전 정의된 가중치 프리셋(skill/wlb/career_ceiling)이 자동 적용됩니다.

### 2. 공고 붙여넣기 → 5단계 라벨

| 라벨 | 점수 | 의미 |
|------|------|------|
| ✅ 지원각 | 80+ | 무조건 넣으세요 |
| 🤔 고민각 | 60~79 | 조건부로 고려 |
| 😐 애매각 | 40~59 | 더 좋은 것 찾아보세요 |
| ⚠️ 패스각 | ~39 | 시간 낭비 |
| ⚫ 함정각 | 점수 무관 | critical 위험 신호 — 점수가 높아도 경고 |

### 3. 근거 인사이트 인용 (RAG)
분석 결과에 **"이 분석의 근거"** 섹션으로 인용된 인사이트와 severity(참고/주의/위험)를 표시합니다. 환각 방지를 위해 직접 큐레이션한 74개 인사이트 DB에서만 근거를 가져옵니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router, Turbopack), React 19, TypeScript, Tailwind v4 |
| 상태관리 | TanStack Query (서버 상태) + Zustand (클라이언트 상태) |
| AI | Claude API — `claude-haiku-4-5` (공고 파싱) + `claude-sonnet-4-6` (채점, Prompt Caching) |
| 임베딩 | Voyage AI `voyage-3` (1024 dim, asymmetric search) |
| DB/Auth | Supabase (PostgreSQL + pgvector + Google OAuth + RLS) |
| 테스트 | Jest + React Testing Library |
| 배포 | Vercel + Sentry |

---

## 아키텍처

```
채용공고 텍스트 입력
        │
        ▼
[1] parsePosting (Claude Haiku, Tool Use)
    공고 → { company, industry, job_category, requirements, raw_signals }
        │
        ├──────────────────────────────────────────────────────┐
        │                    병렬 실행                          │
        ▼                                                      ▼
[2] retrieveInsights                               loadProfile (Supabase)
    Voyage 쿼리 임베딩                             profiles + skills
    → match_insights RPC (pgvector)               → UserProfile
    → specificity 가중 re-ranking
    final_score = similarity × specificity
        │                                                      │
        └──────────────────────────────┬───────────────────────┘
                                       ▼
                        [3] scoreDimensions (Claude Sonnet)
                            system[0]: 프로필 + 채점 규칙
                                       └─ cache_control: ephemeral (5분 TTL)
                            system[1]: 검색된 인사이트 (비캐시)
                            → { skill_match, wlb, career_ceiling }
                               × { score, confidence, evidence, flags }
                                       │
                                       ▼
                        [4] composeResult (순수 함수)
                            가중평균(confidence 보정)
                            → composite_score → 라벨
                            critical 인사이트 → 함정각 오버라이드
                                       │
                                       ▼
                               AnalysisResult 반환
                            + DB 캐시 (SHA-256 중복 방지)
```

---

## 주요 설계 결정

### 가중치 슬라이더 ❌ → 진단 기반 자동 가중치
"사용자는 본인의 정확한 가중치를 모른다"는 가설로, 8문항 양자택일 진단으로 라이프스타일 타입을 분류하고 타입별 사전 정의 가중치를 자동 적용했습니다. 사용자는 가중치 존재 자체를 모릅니다.

### LLM 채점 ↔ 결정적 코드 명확히 분리
- **LLM**: dimension별 점수+근거 추출만 담당
- **코드**: 가중치 적용, 라벨 결정, 함정각 오버라이드

→ eval set으로 회귀 테스트 가능, 단위 테스트 가능, 같은 입력에 항상 같은 결과를 보장합니다.

### 환각 방지: 큐레이션 인사이트 DB + RAG 강제
블라인드 크롤링이나 LLM 자유 생성 없이, 직접 큐레이션한 74개 인사이트에서만 근거를 인용하도록 프롬프트로 강제했습니다. 근거가 없으면 confidence를 낮춰 종합 점수에 영향을 줄입니다.

### Prompt Caching으로 비용 절감
같은 사용자가 여러 공고를 분석할 때 system 프롬프트(사용자 프로필 + 채점 규칙)를 캐싱합니다. 공고당 채점 비용 **~70% 절감**을 달성했습니다.

### specificity 가중 re-ranking
```
final_score = cosine_similarity × specificity

specificity:
  산업 + 직군 + 직무 모두 일치 → 1.0
  산업 + 직군               → 0.85
  산업만                    → 0.7
  직군만                    → 0.5
  범용(모두 null)            → 0.4
  industry 명시 + 산업 불일치 → 0   ← early return (교차 적용 차단)
```

"제약영업 인사이트가 보험 공고에 인용되는" 버그를 early return 설계로 완전 차단했습니다.

---

## Eval 결과

LLM 파이프라인의 점수 일관성을 검증하기 위해 10개 공고에 직접 gold label을 부여하고 회귀 테스트를 구축했습니다.

```bash
npm run eval
```

| 직군 | 공고 수 | 1차 Day 15 | 2차 Day 17 |
|------|---------|------------|------------|
| IT개발·데이터 | 6 | 5/6 (83%) | **6/6 (100%)** |
| 디자인 | 1 | 0/1 (0%) | **1/1 (100%)** |
| 마케팅·홍보 | 1 | 1/1 (100%) | **1/1 (100%)** |
| 영업·판매 | 1 | 1/1 (100%) | **1/1 (100%)** |
| 회계·재무 | 1 | 0/1 (0%) | **1/1 (100%)** |
| **전체** | **10** | **7/10 (70%)** | **10/10 (100%)** |

**튜닝 포인트**: `career_ceiling` 채점 기준을 "산업 성장성"에서 **"본인 커리어 이직 시장 가치"**로 명확화했습니다. 직군 미스매치 페널티(0~15), 니치 산업 페널티(≤55), 산업 매력도 평가 금지 조항을 추가했습니다.

---

## 테스트 커버리지

```bash
npm test
```

| 대상 | 테스트 수 | 커버리지 |
|------|-----------|---------|
| compose-result.ts | 15 케이스 | 100% |
| classify-type.ts | 8 케이스 | 95% |
| AnalysisResultPreview | 5 케이스 + 스냅샷 | 100% |
| **전체** | **28** | **99.41%** |

---

## 로컬 실행

```bash
git clone https://github.com/hjkim1137/jiwongak.git
cd jiwongak
cp .env.local.example .env.local
# .env.local에 키 값 입력 후
npm install
npm run dev
```

필요한 환경변수 목록은 `.env.local.example`을 참고하세요.

---

## 데모 시나리오

로그인 없이 바로 체험 가능합니다:

1. **[결과 미리보기](https://jiwongak.vercel.app/demo)** — 5가지 케이스(지원각·고민각·애매각·패스각·함정각) 즉시 확인
2. **[공고 분석](https://jiwongak.vercel.app/analyze)** — 채용공고 텍스트 붙여넣기 → 분석 결과 (비회원 가능)
3. **[진단 시작](https://jiwongak.vercel.app/diagnosis)** → Google 로그인 → 개인화된 분석
