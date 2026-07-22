# FSD(Feature-Sliced Design) 마이그레이션 설계

## 개요

현재 flat component/lib 구조를 FSD 아키텍처로 전환한다.
목표: 도메인별 관심사 분리, 의존성 방향 강제, 코드 탐색성 향상.

## 현재 구조

```
src/
├── app/          # 라우팅 + API + 일부 비즈니스 로직 (dashboard)
├── components/   # 도메인별 폴더 (auth, health, insight, ...) + ui/ + layout/
├── lib/          # auth, prisma, zhipu, saju, utils, validations/, prompts/
├── types/        # next-auth.d.ts
└── generated/    # Prisma 자동 생성
```

문제점:
- `components/`와 `lib/`가 평면적으로 모든 도메인을 혼합
- 의존성 방향이 명시적이지 않음
- 도메인 간 경계가 폴더 컨벤션에만 의존

## 설계 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| health 서브타입 (medications, nutrition 등) | `health-record` 통합 feature | 독립 API 없이 `/api/health` 공유, 동일 DB 테이블 |
| dashboard | `widgets/dashboard/` | 여러 feature 데이터 조합 (FSD 정석) |
| `cn()` | `shared/lib/cn.ts` | 전역 유틸리티 |
| `hashPassword`, `verifyPassword` | `shared/lib/password.ts` | `shared/lib/auth.ts`에서 사용하므로 shared 레이어에 배치 |
| `generateInviteCode` | `shared/lib/invite-code.ts` | auth register + family 두 API에서 공유 사용 |
| `lib/prompts/*` (saju 제외) | `features/insight/lib/prompts/` | insight feature 전용 |
| `buildHealthAnalysisPrompt` | `shared/lib/health-prompt.ts` | insight + saju 두 feature에서 공유 사용 |
| `SAJU_SYSTEM_PROMPT` | `features/saju/lib/prompts/` | saju feature 전용 |
| `lib/saju.ts` | `features/saju/lib/` | saju feature 전용 |
| `lib/zhipu.ts` | `shared/api/zhipu.ts` | insight, checkup, saju에서 공유 |
| `lib/auth.ts` | `shared/lib/auth.ts` | 전역 인증 인프라 |
| `lib/prisma.ts` | `shared/lib/prisma.ts` | 전역 DB 인프라 |
| Sidebar, Header | `widgets/layout/` | 앱 쉘 조합 컴포넌트 |
| exercise, nutrition, medications (전용 뷰) | 독립 features (UI only) | 전용 페이지와 폼이 존재, model은 health-record에서 import |
| `SymptomQuickForm`, `MentalQuickForm` | `features/health-record/ui/` 추출 | 페이지 인라인 → 컴포넌트 분리 |
| API routes | `app/api/` 유지 | Next.js App Router 규약, 이동 불필요 |
| providers.tsx | `shared/providers/` | 전역 Provider 래퍼 |
| `DAILY_LIMIT` | `shared/config/constants.ts` | insight + saju API에서 공유 (현재 매직넘버 중복) |
| `DISCLAIMER` | `shared/api/zhipu.ts` 유지 | AI 응답 관련이므로 zhipu 클라이언트에 함께 배치 |
| settings 페이지 | app에서 직접 두 feature import | 페이지 레벨 조합은 허용 (widgets 불필요) |

## 목표 구조

```
src/
├── app/                            # 라우팅 + 레이아웃만
│   ├── page.tsx                    → shared/lib/auth (리다이렉트)
│   ├── layout.tsx                  → shared/providers
│   ├── globals.css
│   ├── favicon.ico
│   ├── (auth)/
│   │   ├── layout.tsx              # 변경 없음 (외부 import 없음)
│   │   ├── login/page.tsx          → features/auth
│   │   └── register/page.tsx       → features/auth
│   ├── (app)/
│   │   ├── layout.tsx              → widgets/layout
│   │   ├── dashboard/page.tsx      → widgets/dashboard
│   │   ├── records/page.tsx        → features/health-record
│   │   ├── records/new/page.tsx    → features/health-record
│   │   ├── insight/page.tsx        → features/insight
│   │   ├── checkup/page.tsx        → features/checkup
│   │   ├── goals/page.tsx          → features/goals
│   │   ├── saju/page.tsx           → features/saju
│   │   ├── medications/page.tsx    → features/medications
│   │   ├── nutrition/page.tsx      → features/nutrition
│   │   ├── exercise/page.tsx       → features/exercise
│   │   ├── symptoms/page.tsx       → features/health-record (SymptomQuickForm)
│   │   ├── mental/page.tsx         → features/health-record (MentalQuickForm)
│   │   ├── risk/page.tsx           → features/risk
│   │   ├── timeline/page.tsx       → features/timeline
│   │   ├── settings/page.tsx       → features/settings + features/family
│   │   └── family/join/page.tsx    → features/family
│   └── api/                        # 유지 (import 경로만 변경)
│
├── widgets/
│   ├── layout/
│   │   ├── ui/
│   │   │   ├── sidebar.tsx
│   │   │   └── header.tsx
│   │   └── index.ts
│   └── dashboard/
│       ├── ui/
│       │   ├── dashboard-page.tsx
│       │   ├── stat-cards.tsx
│       │   └── seasonal-card.tsx
│       ├── lib/
│       │   └── seasonal-info.ts
│       └── index.ts
│
├── features/
│   ├── auth/
│   │   ├── ui/
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   └── index.ts
│   │
│   ├── health-record/
│   │   ├── ui/
│   │   │   ├── record-form.tsx
│   │   │   ├── record-list.tsx
│   │   │   ├── record-card.tsx
│   │   │   ├── symptom-quick-form.tsx   # symptoms/page.tsx에서 추출
│   │   │   ├── mental-quick-form.tsx    # mental/page.tsx에서 추출
│   │   │   └── fields/
│   │   │       ├── body-measure-fields.tsx
│   │   │       ├── vital-sign-fields.tsx
│   │   │       ├── activity-fields.tsx
│   │   │       ├── medication-fields.tsx
│   │   │       ├── nutrition-fields.tsx
│   │   │       ├── symptom-fields.tsx
│   │   │       └── mental-fields.tsx
│   │   ├── model/
│   │   │   ├── validation.ts           # Zod 스키마
│   │   │   └── types.ts               # HealthRecordType, typeLabels, summarizeData
│   │   └── index.ts
│   │
│   ├── insight/
│   │   ├── ui/
│   │   │   ├── insight-request.tsx
│   │   │   └── insight-history.tsx
│   │   ├── lib/
│   │   │   └── prompts/
│   │   │       ├── index.ts
│   │   │       ├── health-analysis.ts   # buildHealthAnalysisPrompt 제외
│   │   │       ├── supplement-rec.ts
│   │   │       ├── side-effect.ts
│   │   │       ├── risk-assessment.ts
│   │   │       ├── exercise-rx.ts
│   │   │       ├── nutrition-analysis.ts
│   │   │       └── correlation.ts
│   │   └── index.ts
│   │
│   ├── checkup/
│   │   ├── ui/
│   │   │   ├── checkup-upload.tsx
│   │   │   └── checkup-list.tsx
│   │   └── index.ts
│   │
│   ├── goals/
│   │   ├── ui/
│   │   │   ├── goal-form.tsx
│   │   │   └── goal-list.tsx
│   │   └── index.ts
│   │
│   ├── saju/
│   │   ├── ui/
│   │   │   └── saju-analysis.tsx
│   │   ├── lib/
│   │   │   ├── saju.ts                 # calculateSaju, formatSajuForPrompt
│   │   │   └── prompts/
│   │   │       └── saju-analysis.ts    # SAJU_SYSTEM_PROMPT
│   │   └── index.ts
│   │
│   ├── family/
│   │   ├── ui/
│   │   │   ├── family-settings.tsx
│   │   │   └── join-form.tsx
│   │   └── index.ts
│   │
│   ├── exercise/
│   │   ├── ui/
│   │   │   ├── exercise-form.tsx
│   │   │   └── exercise-summary.tsx
│   │   └── index.ts
│   │
│   ├── nutrition/
│   │   ├── ui/
│   │   │   ├── nutrition-form.tsx
│   │   │   └── nutrition-summary.tsx
│   │   └── index.ts
│   │
│   ├── medications/
│   │   ├── ui/
│   │   │   ├── medication-form.tsx
│   │   │   └── medication-list.tsx
│   │   └── index.ts
│   │
│   ├── risk/
│   │   ├── ui/
│   │   │   └── risk-dashboard.tsx
│   │   └── index.ts
│   │
│   ├── timeline/
│   │   ├── ui/
│   │   │   └── health-timeline.tsx
│   │   └── index.ts
│   │
│   └── settings/
│       ├── ui/
│       │   └── profile-form.tsx
│       └── index.ts
│
├── entities/
│   └── user/
│       ├── model/
│       │   └── types.ts                # User 관련 타입, Session 확장
│       └── index.ts
│
├── shared/
│   ├── ui/                             # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── tabs.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   └── sonner.tsx
│   ├── lib/
│   │   ├── cn.ts                       # cn() 유틸리티
│   │   ├── auth.ts                     # NextAuth 설정
│   │   ├── prisma.ts                   # Prisma 클라이언트
│   │   ├── password.ts                 # hashPassword, verifyPassword
│   │   ├── invite-code.ts             # generateInviteCode
│   │   └── health-prompt.ts           # buildHealthAnalysisPrompt (insight + saju 공유)
│   ├── api/
│   │   └── zhipu.ts                    # Zhipu AI 클라이언트 + DISCLAIMER
│   ├── config/
│   │   └── constants.ts               # DAILY_LIMIT 등 공통 상수
│   └── providers/
│       └── providers.tsx               # SessionProvider
│
├── types/
│   └── next-auth.d.ts
└── generated/
    └── prisma/
```

## 의존성 규칙

```
app → widgets → features → entities → shared
```

- 상위 레이어만 하위 레이어를 import 가능
- 같은 레이어 내 feature 간 직접 UI import 금지 (widgets에서 조합)
- 각 slice는 `index.ts`로 public API 노출
- 외부에서는 반드시 `index.ts`를 통해 import

### 허용 예외

- `features/exercise`, `features/nutrition`, `features/medications`는 `features/health-record/model/`의 타입과 validation을 import 가능 (동일 도메인의 서브 뷰)
- API routes (`app/api/`)는 FSD 레이어 규칙에서 제외 — 필요한 shared, features를 직접 import
- `app/(app)/settings/page.tsx`는 `features/settings` + `features/family` 두 feature를 직접 import (페이지 레벨 조합 허용)

## 마이그레이션 전략: 브릿지 re-export

각 Phase에서 파일을 이동할 때, 기존 경로에 re-export 브릿지를 남겨서 빌드가 항상 통과하도록 한다.
Phase 7에서 모든 브릿지를 제거하고 기존 디렉토리를 삭제한다.

```typescript
// lib/utils.ts (브릿지 - Phase 7에서 삭제)
export { cn } from '@/shared/lib/cn'
export { hashPassword, verifyPassword } from '@/shared/lib/password'
export { generateInviteCode } from '@/shared/lib/invite-code'
```

## 마이그레이션 단계

### Phase 1: shared 레이어 (기반 인프라)
1. `shared/ui/` — `components/ui/*` 이동, 브릿지 생성
2. `shared/lib/cn.ts` — `lib/utils.ts`에서 `cn()` 추출
3. `shared/lib/password.ts` — `lib/utils.ts`에서 `hashPassword`, `verifyPassword` 추출
4. `shared/lib/invite-code.ts` — `lib/utils.ts`에서 `generateInviteCode` 추출
5. `lib/utils.ts`를 re-export 브릿지로 변환
6. `shared/lib/auth.ts` — `lib/auth.ts` 이동 (import를 `@/shared/lib/password`로 변경), 브릿지 생성
7. `shared/lib/prisma.ts` — `lib/prisma.ts` 이동, 브릿지 생성
8. `shared/api/zhipu.ts` — `lib/zhipu.ts` 이동, 브릿지 생성
9. `shared/lib/health-prompt.ts` — `lib/prompts/health-analysis.ts`에서 `buildHealthAnalysisPrompt` 추출
10. `shared/config/constants.ts` — `DAILY_LIMIT = 10` 추출
11. `shared/providers/providers.tsx` — `components/providers.tsx` 이동, 브릿지 생성
12. `components.json` 업데이트:
    - `"ui"`: `"@/components/ui"` → `"@/shared/ui"`
    - `"utils"`: `"@/lib/utils"` → `"@/shared/lib/cn"`
    - `"components"`: `"@/components"` → `"@/shared"`
    - `"lib"`: `"@/lib"` → `"@/shared/lib"`
13. `pnpm build` 검증

### Phase 2: entities 레이어
1. `entities/user/model/types.ts` — User 관련 타입 정의
2. `entities/user/index.ts` — public API export
3. `pnpm build` 검증

### Phase 3: features 레이어 (핵심)
1. `features/auth/` — login-form, register-form + index.ts
2. `features/health-record/` — record 컴포넌트, fields, validation, types
   - `lib/validations/health-record.ts` → `features/health-record/model/validation.ts`
   - `healthRecordTypeLabels` → `features/health-record/model/types.ts`
   - `summarizeData` (dashboard에서 추출) → `features/health-record/model/types.ts`
   - `SymptomQuickForm` (symptoms/page.tsx에서 추출) → `features/health-record/ui/symptom-quick-form.tsx`
   - `MentalQuickForm` (mental/page.tsx에서 추출) → `features/health-record/ui/mental-quick-form.tsx`
   - 브릿지: `lib/validations/health-record.ts` → re-export
3. `features/insight/` — insight UI + prompts (buildHealthAnalysisPrompt 제외, shared로 이동 완료)
   - `lib/prompts/*.ts` → `features/insight/lib/prompts/`
   - 브릿지: `lib/prompts/index.ts` → re-export
4. `features/checkup/` — checkup UI
5. `features/goals/` — goals UI
6. `features/saju/` — saju UI + lib/saju.ts + saju-analysis prompt
   - `lib/saju.ts` → `features/saju/lib/saju.ts`
   - `lib/prompts/saju-analysis.ts` → `features/saju/lib/prompts/saju-analysis.ts`
   - 브릿지: `lib/saju.ts` → re-export
7. `features/family/` — family UI
8. `features/exercise/` — exercise UI
9. `features/nutrition/` — nutrition UI
10. `features/medications/` — medications UI
11. `features/risk/` — risk UI
12. `features/timeline/` — timeline UI
13. `features/settings/` — profile-form
14. 모든 feature에 `index.ts` 생성
15. `pnpm build` 검증

### Phase 4: widgets 레이어
1. `widgets/layout/` — Sidebar, Header 이동 + index.ts
   - 브릿지: `components/layout/sidebar.tsx`, `components/layout/header.tsx` → re-export
2. `widgets/dashboard/` — Dashboard 분해
   - `getSeasonalInfo()` → `widgets/dashboard/lib/seasonal-info.ts`
   - `typeLabels`, `summarizeData` → `features/health-record`에서 import (중복 제거)
   - 통계 카드 → `widgets/dashboard/ui/stat-cards.tsx`
   - 계절 카드 → `widgets/dashboard/ui/seasonal-card.tsx`
   - 메인 → `widgets/dashboard/ui/dashboard-page.tsx`
   - `index.ts` 생성
3. `pnpm build` 검증

### Phase 5: app/ 페이지 import 수정
1. `app/page.tsx` — `@/shared/lib/auth` 사용
2. `app/layout.tsx` — `@/shared/providers` 사용
3. `app/(app)/layout.tsx` — `@/widgets/layout` 사용
4. 모든 `(app)/*/page.tsx` — FSD 경로로 import 변경
5. `app/(auth)/login/page.tsx`, `register/page.tsx` — `@/features/auth` 사용
6. `app/(app)/symptoms/page.tsx` — 인라인 폼 제거, `@/features/health-record` import
7. `app/(app)/mental/page.tsx` — 인라인 폼 제거, `@/features/health-record` import
8. `pnpm build` 검증

### Phase 6: API routes import 수정
1. 모든 `route.ts`의 import 경로를 FSD 경로로 업데이트:
   - `@/lib/auth` → `@/shared/lib/auth`
   - `@/lib/prisma` → `@/shared/lib/prisma`
   - `@/lib/zhipu` → `@/shared/api/zhipu`
   - `@/lib/utils` → `@/shared/lib/password`, `@/shared/lib/invite-code`
   - `@/lib/prompts` → `@/features/insight/lib/prompts`
   - `@/lib/prompts` (buildHealthAnalysisPrompt) → `@/shared/lib/health-prompt`
   - `@/lib/saju` → `@/features/saju/lib/saju`
   - `@/lib/validations/health-record` → `@/features/health-record/model/validation`
2. `pnpm build` 검증

### Phase 7: 정리
1. 모든 브릿지 re-export 파일 삭제
2. 빈 `components/` 디렉토리 삭제 (ui/, layout/, auth/, ... 전부)
3. 빈 `lib/` 디렉토리 삭제 (utils.ts, auth.ts, prisma.ts, zhipu.ts, saju.ts, prompts/, validations/)
4. `pnpm build` 최종 검증
5. `pnpm test` 테스트 통과 확인
6. CLAUDE.md 디렉토리 구조 설명 업데이트

## index.ts 패턴

각 slice의 `index.ts`는 public API만 export:

```typescript
// features/health-record/index.ts
export { RecordForm } from './ui/record-form'
export { RecordList } from './ui/record-list'
export { RecordCard } from './ui/record-card'
export { SymptomQuickForm } from './ui/symptom-quick-form'
export { MentalQuickForm } from './ui/mental-quick-form'
export { healthRecordCreateSchema, type HealthRecordType } from './model/validation'
export { healthRecordTypeLabels, summarizeData } from './model/types'
```

```typescript
// widgets/layout/index.ts
export { Sidebar } from './ui/sidebar'
export { Header } from './ui/header'
```

```typescript
// widgets/dashboard/index.ts
export { DashboardPage } from './ui/dashboard-page'
```

## 테스트 전략

- 각 Phase 완료 후 `pnpm build` 통과 확인
- 최종 완료 후 `pnpm dev`로 전체 기능 동작 확인
- 기존 테스트가 있으면 `pnpm test` 통과 확인

## 리스크와 대응

| 리스크 | 대응 |
|--------|------|
| import 경로 누락으로 빌드 실패 | 브릿지 re-export로 점진적 이동 |
| shadcn/ui CLI가 `components/ui/` 경로 기대 | Phase 1에서 `components.json` alias 업데이트 |
| 순환 의존성 발생 | index.ts를 통한 단방향 의존만 허용 |
| Phase 간 빌드 깨짐 | 브릿지 패턴으로 어느 Phase에서든 빌드 가능 보장 |
| dashboard의 `typeLabels`/`summarizeData` 중복 | Phase 4에서 `features/health-record`에서 import하여 중복 제거 |
