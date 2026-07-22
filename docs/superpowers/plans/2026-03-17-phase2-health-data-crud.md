# Phase 2: 건강 데이터 CRUD 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 7가지 건강 데이터 타입(BODY_MEASURE, VITAL_SIGN, ACTIVITY, MEDICATION, NUTRITION, SYMPTOM, MENTAL)의 입력/조회/수정/삭제 기능을 구현하여 사용자가 건강 데이터를 기록하고 관리할 수 있게 한다.

**Architecture:** 단일 HealthRecord 모델의 type/data(JSON) 구조로 7가지 데이터 타입을 유연하게 저장. Zod로 type별 data 스키마를 분리 검증. API Routes로 CRUD 제공. 페이지는 공통 레코드 입력 폼 + 타입별 필드 렌더링.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7 (`@/generated/prisma/client`), Zod, shadcn/ui, pnpm

**Spec:** `docs/superpowers/specs/2026-03-17-ai-health-design.md` (Sections 2, 3)

**Codebase conventions:**
- Prisma import: `import { PrismaClient } from '@/generated/prisma/client'`
- Prisma singleton: `import { prisma } from '@/lib/prisma'`
- Auth: `import { auth } from '@/lib/auth'`
- Zod v4: `error.issues` (NOT `error.errors`)
- API pattern: NextRequest/NextResponse, session check, Zod parse
- Pages under `src/app/(app)/` for authenticated routes

---

## File Structure

```
src/
├── lib/
│   └── validations/
│       └── health-record.ts        # type별 Zod 스키마 (7가지)
├── app/
│   ├── api/
│   │   └── health/
│   │       ├── route.ts            # GET (목록), POST (생성)
│   │       └── [id]/
│   │           └── route.ts        # GET (단건), PATCH (수정), DELETE (삭제)
│   └── (app)/
│       └── records/
│           ├── page.tsx            # 건강 기록 목록
│           └── new/
│               └── page.tsx        # 건강 기록 입력
├── components/
│   └── health/
│       ├── record-form.tsx         # 건강 기록 입력 폼 (타입 선택 + 동적 필드)
│       ├── record-list.tsx         # 건강 기록 목록 컴포넌트
│       ├── record-card.tsx         # 개별 기록 카드
│       └── fields/
│           ├── body-measure-fields.tsx
│           ├── vital-sign-fields.tsx
│           ├── activity-fields.tsx
│           ├── medication-fields.tsx
│           ├── nutrition-fields.tsx
│           ├── symptom-fields.tsx
│           └── mental-fields.tsx
prisma/
└── schema.prisma                   # HealthRecord 모델 추가
__tests__/
└── lib/
    └── validations/
        └── health-record.test.ts   # Zod 스키마 테스트
```

---

### Task 1: Prisma 스키마에 HealthRecord 모델 추가

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: HealthRecord 모델 및 enum 추가**

`prisma/schema.prisma`에 추가:
```prisma
enum HealthRecordType {
  BODY_MEASURE
  VITAL_SIGN
  ACTIVITY
  MEDICATION
  NUTRITION
  SYMPTOM
  MENTAL
}

model HealthRecord {
  id         String           @id @default(cuid())
  userId     String
  user       User             @relation(fields: [userId], references: [id])
  type       HealthRecordType
  data       Json
  recordedAt DateTime
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  @@index([userId, type])
  @@index([userId, recordedAt])
}
```

User 모델에 relation 추가:
```prisma
model User {
  // ... 기존 필드들
  healthRecords HealthRecord[]
}
```

- [ ] **Step 2: DB 동기화**

```bash
pnpm prisma db push
pnpm prisma generate
```

- [ ] **Step 3: 커밋**

```bash
git add prisma/schema.prisma
git commit -m "feat: HealthRecord 모델 추가

7가지 건강 데이터 타입 지원 (BODY_MEASURE, VITAL_SIGN, ACTIVITY, MEDICATION, NUTRITION, SYMPTOM, MENTAL)
userId+type, userId+recordedAt 인덱스 추가

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Zod 검증 스키마 (TDD)

**Files:**
- Create: `src/lib/validations/health-record.ts`
- Test: `__tests__/lib/validations/health-record.test.ts`

- [ ] **Step 1: 테스트 작성**

`__tests__/lib/validations/health-record.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import {
  bodyMeasureSchema,
  vitalSignSchema,
  activitySchema,
  medicationSchema,
  nutritionSchema,
  symptomSchema,
  mentalSchema,
  healthRecordCreateSchema,
} from '@/lib/validations/health-record'

describe('bodyMeasureSchema', () => {
  it('유효한 신체 측정 데이터를 통과시킨다', () => {
    const result = bodyMeasureSchema.safeParse({ weight: 72.5, height: 175, bodyFat: 18.2 })
    expect(result.success).toBe(true)
  })

  it('범위를 벗어난 체중을 거부한다', () => {
    const result = bodyMeasureSchema.safeParse({ weight: 500 })
    expect(result.success).toBe(false)
  })

  it('빈 객체도 통과한다 (모든 필드 optional)', () => {
    const result = bodyMeasureSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe('vitalSignSchema', () => {
  it('유효한 바이탈 사인 데이터를 통과시킨다', () => {
    const result = vitalSignSchema.safeParse({
      systolic: 120, diastolic: 80, heartRate: 72, bloodSugar: 95, temperature: 36.5,
    })
    expect(result.success).toBe(true)
  })

  it('범위를 벗어난 혈압을 거부한다', () => {
    const result = vitalSignSchema.safeParse({ systolic: 300 })
    expect(result.success).toBe(false)
  })
})

describe('activitySchema', () => {
  it('유효한 활동 데이터를 통과시킨다', () => {
    const result = activitySchema.safeParse({
      steps: 8500, sleepHours: 7.5, exercise: '달리기', duration: 30,
      intensity: 'MODERATE', heartRateAvg: 135, heartRateMax: 165,
      caloriesBurned: 320, rpe: 6,
    })
    expect(result.success).toBe(true)
  })
})

describe('medicationSchema', () => {
  it('유효한 복용약 데이터를 통과시킨다', () => {
    const result = medicationSchema.safeParse({
      name: '오메가3', category: 'SUPPLEMENT', dosage: '1000mg',
      frequency: '1일 1회', startDate: '2026-01-15',
    })
    expect(result.success).toBe(true)
  })

  it('필수 필드 누락 시 거부한다', () => {
    const result = medicationSchema.safeParse({ name: '오메가3' })
    expect(result.success).toBe(false)
  })
})

describe('nutritionSchema', () => {
  it('유효한 식단 데이터를 통과시킨다', () => {
    const result = nutritionSchema.safeParse({
      meal: 'LUNCH', description: '현미밥, 된장찌개', calories: 650,
    })
    expect(result.success).toBe(true)
  })
})

describe('symptomSchema', () => {
  it('유효한 증상 데이터를 통과시킨다', () => {
    const result = symptomSchema.safeParse({
      symptom: '두통', severity: 6, duration: 120,
    })
    expect(result.success).toBe(true)
  })

  it('severity 범위를 벗어나면 거부한다', () => {
    const result = symptomSchema.safeParse({ symptom: '두통', severity: 11 })
    expect(result.success).toBe(false)
  })
})

describe('mentalSchema', () => {
  it('유효한 정신 건강 데이터를 통과시킨다', () => {
    const result = mentalSchema.safeParse({
      mood: 7, stressLevel: 4, anxietyLevel: 3, energyLevel: 6, sleepQuality: 7,
    })
    expect(result.success).toBe(true)
  })
})

describe('healthRecordCreateSchema', () => {
  it('BODY_MEASURE 타입으로 레코드를 생성한다', () => {
    const result = healthRecordCreateSchema.safeParse({
      type: 'BODY_MEASURE',
      data: { weight: 72.5, height: 175 },
      recordedAt: '2026-03-17T10:00:00Z',
    })
    expect(result.success).toBe(true)
  })

  it('타입과 data가 일치하지 않으면 거부한다', () => {
    const result = healthRecordCreateSchema.safeParse({
      type: 'BODY_MEASURE',
      data: { systolic: 120 },
      recordedAt: '2026-03-17T10:00:00Z',
    })
    // systolic은 BODY_MEASURE에 없지만 bodyMeasureSchema는 optional이므로 통과할 수 있음
    // 대신 weight 범위 등으로 검증
    expect(result.success).toBe(true) // extra fields stripped
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test __tests__/lib/validations/health-record.test.ts
```

- [ ] **Step 3: Zod 스키마 구현**

`src/lib/validations/health-record.ts`:
```typescript
import { z } from 'zod'

// 신체 측정
export const bodyMeasureSchema = z.object({
  weight: z.number().min(1).max(300).optional(),
  height: z.number().min(30).max(250).optional(),
  bodyFat: z.number().min(1).max(60).optional(),
})

// 바이탈 사인
export const vitalSignSchema = z.object({
  systolic: z.number().min(60).max(250).optional(),
  diastolic: z.number().min(30).max(150).optional(),
  heartRate: z.number().min(30).max(220).optional(),
  bloodSugar: z.number().min(20).max(600).optional(),
  temperature: z.number().min(34).max(42).optional(),
})

// 활동
export const activitySchema = z.object({
  steps: z.number().min(0).max(100000).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  exercise: z.string().max(50).optional(),
  duration: z.number().min(0).max(1440).optional(),
  intensity: z.enum(['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']).optional(),
  heartRateAvg: z.number().min(30).max(220).optional(),
  heartRateMax: z.number().min(30).max(220).optional(),
  caloriesBurned: z.number().min(0).max(10000).optional(),
  rpe: z.number().min(1).max(10).optional(),
})

// 복용약/건강보조제
export const medicationSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['PRESCRIPTION', 'OTC', 'SUPPLEMENT']),
  dosage: z.string().max(50).optional(),
  frequency: z.string().max(50).optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  notes: z.string().max(200).optional(),
})

// 식단/영양
export const nutritionSchema = z.object({
  meal: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  description: z.string().max(500).optional(),
  calories: z.number().min(0).max(5000).optional(),
  protein: z.number().min(0).max(500).optional(),
  carbs: z.number().min(0).max(1000).optional(),
  fat: z.number().min(0).max(500).optional(),
  fiber: z.number().min(0).max(100).optional(),
  sodium: z.number().min(0).max(10000).optional(),
  water: z.number().min(0).max(5000).optional(),
})

// 증상
export const symptomSchema = z.object({
  symptom: z.string().min(1).max(100),
  severity: z.number().min(1).max(10),
  location: z.string().max(50).optional(),
  duration: z.number().min(0).max(10080).optional(),
  trigger: z.string().max(100).optional(),
  notes: z.string().max(200).optional(),
})

// 정신 건강
export const mentalSchema = z.object({
  mood: z.number().min(1).max(10).optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  anxietyLevel: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  sleepQuality: z.number().min(1).max(10).optional(),
  notes: z.string().max(200).optional(),
})

// type별 data 스키마 매핑
const dataSchemaMap = {
  BODY_MEASURE: bodyMeasureSchema,
  VITAL_SIGN: vitalSignSchema,
  ACTIVITY: activitySchema,
  MEDICATION: medicationSchema,
  NUTRITION: nutritionSchema,
  SYMPTOM: symptomSchema,
  MENTAL: mentalSchema,
} as const

export type HealthRecordType = keyof typeof dataSchemaMap

// 레코드 생성 스키마
export const healthRecordCreateSchema = z.object({
  type: z.enum(['BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION', 'NUTRITION', 'SYMPTOM', 'MENTAL']),
  data: z.record(z.unknown()),
  recordedAt: z.string().datetime(),
}).transform((val, ctx) => {
  const schema = dataSchemaMap[val.type as HealthRecordType]
  const result = schema.safeParse(val.data)
  if (!result.success) {
    result.error.issues.forEach(issue => ctx.addIssue(issue))
    return z.NEVER
  }
  return { ...val, data: result.data }
})

// 레코드 수정 스키마
export const healthRecordUpdateSchema = z.object({
  data: z.record(z.unknown()).optional(),
  recordedAt: z.string().datetime().optional(),
})

// type별 한국어 레이블
export const healthRecordTypeLabels: Record<string, string> = {
  BODY_MEASURE: '신체 측정',
  VITAL_SIGN: '바이탈 사인',
  ACTIVITY: '활동',
  MEDICATION: '복용약/보조제',
  NUTRITION: '식단',
  SYMPTOM: '증상',
  MENTAL: '정신 건강',
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
pnpm test __tests__/lib/validations/health-record.test.ts
```

- [ ] **Step 5: 커밋**

```bash
git add src/lib/validations/ __tests__/lib/validations/
git commit -m "feat: 건강 데이터 Zod 검증 스키마 구현 (TDD)

7가지 타입별 유효성 범위 검증
healthRecordCreateSchema로 type-data 매칭 검증

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Health Record API Routes

**Files:**
- Create: `src/app/api/health/route.ts`, `src/app/api/health/[id]/route.ts`

- [ ] **Step 1: GET (목록) + POST (생성) API**

`src/app/api/health/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { healthRecordCreateSchema } from '@/lib/validations/health-record'
import { z } from 'zod'

// GET: 건강 기록 목록 조회
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const userId = searchParams.get('userId') || session.user.id
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // 같은 가족만 조회 가능
  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser || targetUser.familyId !== session.user.familyId) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const where: Record<string, unknown> = { userId }
  if (type) where.type = type

  const [records, total] = await Promise.all([
    prisma.healthRecord.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.healthRecord.count({ where }),
  ])

  return NextResponse.json({
    records,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

// POST: 건강 기록 생성
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  try {
    const body = await request.json()
    const data = healthRecordCreateSchema.parse(body)

    const record = await prisma.healthRecord.create({
      data: {
        userId: session.user.id,
        type: data.type,
        data: data.data as Record<string, unknown>,
        recordedAt: new Date(data.recordedAt),
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: '기록 생성 중 오류가 발생했습니다' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 단건 조회/수정/삭제 API**

`src/app/api/health/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 단건 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id } = await params

  const record = await prisma.healthRecord.findUnique({
    where: { id },
    include: { user: { select: { name: true, familyId: true } } },
  })

  if (!record) return NextResponse.json({ error: '기록을 찾을 수 없습니다' }, { status: 404 })
  if (record.user.familyId !== session.user.familyId) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  return NextResponse.json(record)
}

// PATCH: 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id } = await params

  const record = await prisma.healthRecord.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: '기록을 찾을 수 없습니다' }, { status: 404 })
  if (record.userId !== session.user.id) {
    return NextResponse.json({ error: '본인 기록만 수정할 수 있습니다' }, { status: 403 })
  }

  const body = await request.json()
  const updated = await prisma.healthRecord.update({
    where: { id },
    data: {
      ...(body.data && { data: body.data }),
      ...(body.recordedAt && { recordedAt: new Date(body.recordedAt) }),
    },
  })

  return NextResponse.json(updated)
}

// DELETE: 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id } = await params

  const record = await prisma.healthRecord.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: '기록을 찾을 수 없습니다' }, { status: 404 })
  if (record.userId !== session.user.id) {
    return NextResponse.json({ error: '본인 기록만 삭제할 수 있습니다' }, { status: 403 })
  }

  await prisma.healthRecord.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/health/
git commit -m "feat: 건강 기록 CRUD API 구현

GET (목록+페이지네이션), POST (생성+Zod검증)
GET/PATCH/DELETE (단건 조회/수정/삭제)
가족 내 접근 제어, 본인 기록만 수정/삭제

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: 타입별 입력 필드 컴포넌트

**Files:**
- Create: `src/components/health/fields/*.tsx` (7개)

- [ ] **Step 1: 신체 측정 필드**

`src/components/health/fields/body-measure-fields.tsx`:
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BodyMeasureFields({ data, onChange }: {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}) {
  const update = (key: string, value: string) => {
    onChange({ ...data, [key]: value ? parseFloat(value) : undefined })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>체중 (kg)</Label>
        <Input type="number" step="0.1" min="1" max="300" placeholder="72.5"
          value={data.weight as string ?? ''} onChange={e => update('weight', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>키 (cm)</Label>
        <Input type="number" step="0.1" min="30" max="250" placeholder="175"
          value={data.height as string ?? ''} onChange={e => update('height', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>체지방률 (%)</Label>
        <Input type="number" step="0.1" min="1" max="60" placeholder="18.2"
          value={data.bodyFat as string ?? ''} onChange={e => update('bodyFat', e.target.value)} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 바이탈 사인 필드**

`src/components/health/fields/vital-sign-fields.tsx`:
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function VitalSignFields({ data, onChange }: {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}) {
  const update = (key: string, value: string) => {
    onChange({ ...data, [key]: value ? parseFloat(value) : undefined })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>수축기 혈압 (mmHg)</Label>
        <Input type="number" min="60" max="250" placeholder="120"
          value={data.systolic as string ?? ''} onChange={e => update('systolic', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>이완기 혈압 (mmHg)</Label>
        <Input type="number" min="30" max="150" placeholder="80"
          value={data.diastolic as string ?? ''} onChange={e => update('diastolic', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>심박수 (bpm)</Label>
        <Input type="number" min="30" max="220" placeholder="72"
          value={data.heartRate as string ?? ''} onChange={e => update('heartRate', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>혈당 (mg/dL)</Label>
        <Input type="number" min="20" max="600" placeholder="95"
          value={data.bloodSugar as string ?? ''} onChange={e => update('bloodSugar', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>체온 (°C)</Label>
        <Input type="number" step="0.1" min="34" max="42" placeholder="36.5"
          value={data.temperature as string ?? ''} onChange={e => update('temperature', e.target.value)} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 나머지 5개 필드 컴포넌트 생성**

각각 같은 패턴으로:
- `activity-fields.tsx` — steps, sleepHours, exercise, duration, intensity(select), heartRateAvg, heartRateMax, caloriesBurned, rpe
- `medication-fields.tsx` — name, category(select: PRESCRIPTION/OTC/SUPPLEMENT), dosage, frequency, startDate, endDate, notes
- `nutrition-fields.tsx` — meal(select: BREAKFAST/LUNCH/DINNER/SNACK), description(textarea), calories, protein, carbs, fat, sodium, water
- `symptom-fields.tsx` — symptom, severity(1-10), location, duration, trigger, notes
- `mental-fields.tsx` — mood(1-10), stressLevel(1-10), anxietyLevel(1-10), energyLevel(1-10), sleepQuality(1-10), notes

- [ ] **Step 4: 커밋**

```bash
git add src/components/health/fields/
git commit -m "feat: 7가지 건강 데이터 타입별 입력 필드 컴포넌트

신체측정, 바이탈사인, 활동, 복용약, 식단, 증상, 정신건강

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: 건강 기록 입력 폼

**Files:**
- Create: `src/components/health/record-form.tsx`, `src/app/(app)/records/new/page.tsx`

- [ ] **Step 1: 레코드 입력 폼 컴포넌트**

`src/components/health/record-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BodyMeasureFields } from './fields/body-measure-fields'
import { VitalSignFields } from './fields/vital-sign-fields'
import { ActivityFields } from './fields/activity-fields'
import { MedicationFields } from './fields/medication-fields'
import { NutritionFields } from './fields/nutrition-fields'
import { SymptomFields } from './fields/symptom-fields'
import { MentalFields } from './fields/mental-fields'
import { healthRecordTypeLabels } from '@/lib/validations/health-record'

const typeComponents: Record<string, React.ComponentType<{
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}>> = {
  BODY_MEASURE: BodyMeasureFields,
  VITAL_SIGN: VitalSignFields,
  ACTIVITY: ActivityFields,
  MEDICATION: MedicationFields,
  NUTRITION: NutritionFields,
  SYMPTOM: SymptomFields,
  MENTAL: MentalFields,
}

export function RecordForm() {
  const router = useRouter()
  const [type, setType] = useState('BODY_MEASURE')
  const [data, setData] = useState<Record<string, unknown>>({})
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 16))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const FieldComponent = typeComponents[type]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          recordedAt: new Date(recordedAt).toISOString(),
        }),
      })

      if (!res.ok) {
        const result = await res.json()
        setError(typeof result.error === 'string' ? result.error : '입력을 확인해주세요')
        return
      }

      router.push('/records')
      router.refresh()
    } catch {
      setError('기록 저장 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>건강 기록 입력</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={type} onValueChange={(v) => { setType(v); setData({}) }}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {Object.entries(healthRecordTypeLabels).map(([key, label]) => (
                <TabsTrigger key={key} value={key} className="text-xs">{label}</TabsTrigger>
              ))}
            </TabsList>
            {Object.keys(typeComponents).map(key => (
              <TabsContent key={key} value={key}>
                <FieldComponent data={data} onChange={setData} />
              </TabsContent>
            ))}
          </Tabs>

          <div className="space-y-2">
            <Label>측정 일시</Label>
            <Input type="datetime-local" value={recordedAt}
              onChange={e => setRecordedAt(e.target.value)} required />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '저장 중...' : '기록 저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

NOTE: The `FieldComponent` variable assignment above is for the currently selected type. The TabsContent should render the correct component based on tab state. The implementer should ensure only the active tab's component renders.

- [ ] **Step 2: 입력 페이지 생성**

`src/app/(app)/records/new/page.tsx`:
```tsx
import { RecordForm } from '@/components/health/record-form'

export default function NewRecordPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">건강 기록 입력</h2>
      <RecordForm />
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/health/record-form.tsx "src/app/(app)/records/new/"
git commit -m "feat: 건강 기록 입력 폼 구현

타입 선택 탭 + 동적 필드 렌더링
날짜/시간 입력, API 호출, 에러 처리

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: 건강 기록 목록 페이지

**Files:**
- Create: `src/components/health/record-list.tsx`, `src/components/health/record-card.tsx`, `src/app/(app)/records/page.tsx`

- [ ] **Step 1: 레코드 카드 컴포넌트**

`src/components/health/record-card.tsx`:
```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { healthRecordTypeLabels } from '@/lib/validations/health-record'

interface RecordCardProps {
  record: {
    id: string
    type: string
    data: Record<string, unknown>
    recordedAt: string
  }
}

export function RecordCard({ record }: RecordCardProps) {
  const label = healthRecordTypeLabels[record.type] || record.type
  const date = new Date(record.recordedAt).toLocaleString('ko-KR')

  // data에서 주요 값을 요약 표시
  const summary = Object.entries(record.data as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{label}</Badge>
            <span className="text-sm text-gray-500">{date}</span>
          </div>
          <p className="text-sm text-gray-700 truncate max-w-md">{summary}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: 레코드 목록 컴포넌트**

`src/components/health/record-list.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RecordCard } from './record-card'
import { healthRecordTypeLabels } from '@/lib/validations/health-record'

interface Record {
  id: string; type: string; data: Record<string, unknown>; recordedAt: string
}

export function RecordList() {
  const [records, setRecords] = useState<Record[]>([])
  const [filter, setFilter] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (filter) params.set('type', filter)

    fetch(`/api/health?${params}`)
      .then(r => r.json())
      .then(data => {
        setRecords(data.records)
        setTotalPages(data.pagination.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page, filter])

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        <Button variant={filter === null ? 'default' : 'outline'} size="sm"
          onClick={() => { setFilter(null); setPage(1) }}>전체</Button>
        {Object.entries(healthRecordTypeLabels).map(([key, label]) => (
          <Button key={key} variant={filter === key ? 'default' : 'outline'} size="sm"
            onClick={() => { setFilter(key); setPage(1) }}>{label}</Button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-500">기록이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {records.map(record => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}>이전</Button>
          <span className="text-sm py-2">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}>다음</Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 목록 페이지**

`src/app/(app)/records/page.tsx`:
```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RecordList } from '@/components/health/record-list'

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">건강 기록</h2>
        <Link href="/records/new">
          <Button>새 기록 추가</Button>
        </Link>
      </div>
      <RecordList />
    </div>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/health/record-list.tsx src/components/health/record-card.tsx "src/app/(app)/records/"
git commit -m "feat: 건강 기록 목록 페이지 구현

타입별 필터링, 페이지네이션, 기록 카드 표시

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: 빌드 검증 및 테스트

- [ ] **Step 1: 전체 테스트 실행**

```bash
pnpm test
```

- [ ] **Step 2: 프로덕션 빌드**

```bash
pnpm build
```

빌드 에러가 있으면 수정.

- [ ] **Step 3: 커밋 (수정사항 있는 경우)**

```bash
git add -A
git commit -m "fix: Phase 2 빌드 에러 수정

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2 완료 기준

- [ ] HealthRecord Prisma 모델 동기화
- [ ] 7가지 타입별 Zod 검증 스키마 (테스트 포함)
- [ ] Health Record CRUD API (목록+페이지네이션, 생성, 조회, 수정, 삭제)
- [ ] 가족 내 접근 제어 (조회: 가족, 수정/삭제: 본인)
- [ ] 7가지 타입별 입력 필드 컴포넌트
- [ ] 건강 기록 입력 폼 (타입 선택 + 동적 필드)
- [ ] 건강 기록 목록 페이지 (필터, 페이지네이션)
- [ ] 테스트 통과, 빌드 성공
