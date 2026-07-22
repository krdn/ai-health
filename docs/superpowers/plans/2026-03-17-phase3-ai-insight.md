# Phase 3: AI 인사이트 엔진 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zhipu AI GLM-4-Plus를 연동하여 건강 데이터 기반 AI 분석, 보조제 추천, 처방약 부작용 분석 기능을 구현한다. InsightHistory 모델로 분석 이력을 관리하고, 일일 요청 횟수를 제한한다.

**Architecture:** API Route에서 사용자 건강 데이터를 수집 → 구조화된 프롬프트 생성 → Zhipu AI API 호출 → 응답 저장 및 반환. 분석 유형별 시스템 프롬프트 분리. 면책 조항 자동 포함.

**Tech Stack:** Zhipu AI SDK, Prisma 7 (`@/generated/prisma/client`), Zod, Next.js 16

**Codebase conventions:**
- Prisma: `import { prisma } from '@/lib/prisma'`
- Auth: `import { auth } from '@/lib/auth'`
- Zod v4: `error.issues`
- API: NextRequest/NextResponse pattern

---

## File Structure

```
src/
├── lib/
│   ├── zhipu.ts                     # Zhipu AI 클라이언트
│   └── prompts/
│       ├── health-analysis.ts       # 건강 분석 프롬프트
│       ├── supplement-rec.ts        # 보조제 추천 프롬프트
│       └── side-effect.ts           # 부작용 분석 프롬프트
├── app/
│   ├── api/
│   │   └── insight/
│   │       ├── route.ts             # POST (분석 요청), GET (이력 조회)
│   │       └── [id]/route.ts        # GET (단건 조회)
│   └── (app)/
│       └── insight/
│           └── page.tsx             # AI 분석 페이지
├── components/
│   └── insight/
│       ├── insight-request.tsx      # 분석 요청 폼
│       └── insight-history.tsx      # 분석 이력 목록
prisma/
└── schema.prisma                    # InsightHistory 모델 추가
```

---

### Task 1: Prisma InsightHistory 모델 + Zhipu AI 클라이언트

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/lib/zhipu.ts`

- [ ] **Step 1: InsightHistory 모델 추가**

```prisma
enum InsightType {
  HEALTH
  SAJU
  CHECKUP
  SUPPLEMENT_REC
  SIDE_EFFECT
  RISK_ASSESSMENT
  EXERCISE_RX
  NUTRITION_ANALYSIS
  CORRELATION
  SEASONAL
  FAMILY_PATTERN
  COMBINED
}

model InsightHistory {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  type      InsightType
  prompt    String      @db.Text
  response  String      @db.Text
  fromDate  DateTime?
  toDate    DateTime?
  createdAt DateTime    @default(now())

  @@index([userId, type])
  @@index([userId, createdAt])
}
```

Add `insights InsightHistory[]` to User model.

```bash
pnpm prisma db push && pnpm prisma generate
```

- [ ] **Step 2: Zhipu AI 클라이언트 생성**

`src/lib/zhipu.ts`:
```typescript
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

interface ZhipuMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ZhipuResponse {
  choices: { message: { content: string } }[]
}

export async function chatWithZhipu(messages: ZhipuMessage[]): Promise<string> {
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) throw new Error('ZHIPU_API_KEY 환경 변수가 설정되지 않았습니다')

  const res = await fetch(ZHIPU_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'glm-4-plus',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Zhipu AI API 오류: ${res.status} ${error}`)
  }

  const data = (await res.json()) as ZhipuResponse
  return data.choices[0].message.content
}

export const DISCLAIMER = '\n\n---\n⚠️ 본 분석은 참고용이며 의학적 진단이나 처방을 대체하지 않습니다. 약물 변경이나 건강 관련 결정은 반드시 의료 전문가와 상담하세요.'
```

- [ ] **Step 3: 커밋**

Commit: "feat: InsightHistory 모델 + Zhipu AI 클라이언트"

---

### Task 2: 프롬프트 템플릿

**Files:**
- Create: `src/lib/prompts/health-analysis.ts`, `supplement-rec.ts`, `side-effect.ts`

- [ ] **Step 1: 건강 분석 프롬프트**

`src/lib/prompts/health-analysis.ts`:
```typescript
import type { HealthRecord } from '@/generated/prisma/client'

export function buildHealthAnalysisPrompt(records: HealthRecord[], userName: string): string {
  const grouped = records.reduce((acc, r) => {
    const type = r.type
    if (!acc[type]) acc[type] = []
    acc[type].push(r)
    return acc
  }, {} as Record<string, HealthRecord[]>)

  let dataSection = ''
  for (const [type, recs] of Object.entries(grouped)) {
    dataSection += `\n### ${type}\n`
    for (const r of recs) {
      const date = new Date(r.recordedAt).toLocaleDateString('ko-KR')
      dataSection += `- ${date}: ${JSON.stringify(r.data)}\n`
    }
  }

  return `${userName}님의 최근 건강 데이터를 분석해주세요.\n${dataSection}`
}

export const HEALTH_SYSTEM_PROMPT = `당신은 내과, 예방의학, 영양학에 정통한 건강 분석 AI 전문가입니다.
사용자의 건강 데이터를 분석하여 다음을 제공하세요:

1. **건강 상태 요약**: 주요 지표의 현재 상태
2. **추세 분석**: 시간에 따른 변화 패턴
3. **주의 사항**: 정상 범위를 벗어나거나 우려되는 수치
4. **생활 습관 조언**: 개선을 위한 구체적 권장사항

응답은 한국어로, 이해하기 쉽게 작성하세요. 의학 용어는 괄호 안에 설명을 추가하세요.`
```

- [ ] **Step 2: 보조제 추천 프롬프트**

`src/lib/prompts/supplement-rec.ts`:
```typescript
export const SUPPLEMENT_SYSTEM_PROMPT = `당신은 영양학과 약학에 정통한 건강보조제 추천 AI 전문가입니다.
사용자의 건강 데이터, 검진 결과, 현재 복용약을 분석하여 다음을 제공하세요:

1. **부족 영양소 분석**: 건강 수치에서 파악되는 영양 결핍
2. **추천 보조제**: 구체적 보조제명, 권장 용량, 복용 시기
3. **현재 복용 중 보조제 평가**: 적정 여부, 과다 복용 위험
4. **주의사항**: 처방약과의 상호작용 경고

응답은 한국어로, 근거를 함께 제시하세요.`
```

- [ ] **Step 3: 부작용 분석 프롬프트**

`src/lib/prompts/side-effect.ts`:
```typescript
export const SIDE_EFFECT_SYSTEM_PROMPT = `당신은 약학과 임상의학에 정통한 약물 부작용 분석 AI 전문가입니다.
사용자의 복용약 목록과 건강 데이터 변화를 분석하여 다음을 제공하세요:

1. **알려진 부작용**: 각 처방약의 주요 부작용
2. **약물 간 상호작용**: 병용 시 위험한 조합
3. **건강 수치 연관 분석**: 약 복용 시작 후 건강 수치 변화와 부작용 연관성
4. **처방약-보조제 충돌**: 복용 중인 보조제와의 상호작용

응답은 한국어로, 위험도를 명시하세요 (낮음/보통/높음).`
```

- [ ] **Step 4: 커밋**

Commit: "feat: AI 분석 프롬프트 템플릿 (건강/보조제/부작용)"

---

### Task 3: Insight API Routes

**Files:**
- Create: `src/app/api/insight/route.ts`, `src/app/api/insight/[id]/route.ts`

- [ ] **Step 1: POST (분석 요청) + GET (이력 조회)**

`src/app/api/insight/route.ts`:
- POST: type(InsightType), fromDate?, toDate? 받아서 해당 기간 데이터 수집 → 프롬프트 생성 → Zhipu AI 호출 → InsightHistory 저장 → 응답 반환
- 일일 요청 제한: 가족 단위 10회/일 (InsightHistory.createdAt count)
- Zhipu API 실패 시: "분석을 일시적으로 수행할 수 없습니다" 반환
- GET: 사용자 InsightHistory 목록 (페이지네이션, type 필터)

- [ ] **Step 2: GET (단건 조회)**

`src/app/api/insight/[id]/route.ts`

- [ ] **Step 3: 커밋**

Commit: "feat: AI 인사이트 API (분석 요청, 이력 조회)"

---

### Task 4: AI 분석 페이지 UI

**Files:**
- Create: `src/components/insight/insight-request.tsx`, `src/components/insight/insight-history.tsx`, `src/app/(app)/insight/page.tsx`

- [ ] **Step 1: 분석 요청 폼**

insight-request.tsx:
- 분석 유형 선택 (HEALTH, SUPPLEMENT_REC, SIDE_EFFECT)
- 기간 선택 (fromDate, toDate — 기본 30일)
- 요청 버튼 → POST /api/insight
- 응답을 마크다운으로 렌더링 (간단한 whitespace 보존)
- 면책 조항 자동 표시

- [ ] **Step 2: 분석 이력 목록**

insight-history.tsx:
- GET /api/insight로 이력 조회
- 타입별 필터, 날짜 표시, 응답 미리보기

- [ ] **Step 3: 페이지 조합**

`src/app/(app)/insight/page.tsx`

- [ ] **Step 4: 커밋**

Commit: "feat: AI 인사이트 페이지 UI 구현"

---

### Task 5: 빌드 검증

- [ ] **Step 1: 테스트 + 빌드**

```bash
pnpm test && pnpm build
```

Fix any errors.

- [ ] **Step 2: 커밋 (수정사항 있는 경우)**

---

## Phase 3 완료 기준

- [ ] InsightHistory Prisma 모델
- [ ] Zhipu AI 클라이언트 (API 호출, 에러 처리)
- [ ] 3종 프롬프트 템플릿 (건강 분석, 보조제 추천, 부작용)
- [ ] Insight API (POST 분석 요청 + 일일 제한, GET 이력)
- [ ] AI 분석 페이지 (요청 폼 + 이력)
- [ ] 면책 조항 자동 표시
- [ ] 테스트 통과, 빌드 성공
