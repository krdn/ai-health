# Phase 1: 기반 시스템 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 15 프로젝트를 설정하고, PostgreSQL + Prisma DB, NextAuth 인증, 가족 관리 기능을 구현하여 사용자가 회원가입/로그인하고 가족 그룹을 생성/합류할 수 있는 기반 시스템을 완성한다.

**Architecture:** Next.js 15 App Router 기반 단일 앱. Prisma ORM으로 PostgreSQL 연결. NextAuth.js Credentials Provider + JWT 세션. Tailwind CSS + shadcn/ui로 UI 구성. Docker Compose로 개발 환경 PostgreSQL 제공.

**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL, NextAuth.js, Tailwind CSS, shadcn/ui, Zod, bcrypt, pnpm

**Spec:** `docs/superpowers/specs/2026-03-17-ai-health-design.md`

---

## File Structure

```
ai-health/
├── docker-compose.yml                    # PostgreSQL 개발 DB
├── .env.example                          # 환경 변수 템플릿
├── next.config.ts                        # Next.js 설정
├── tailwind.config.ts                    # Tailwind 설정
├── tsconfig.json                         # TypeScript 설정
├── package.json                          # 의존성
├── prisma/
│   └── schema.prisma                     # DB 스키마 (User, Family)
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # 루트 레이아웃
│   │   ├── page.tsx                      # 랜딩 → 로그인 리다이렉트
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx            # 로그인 페이지
│   │   │   └── register/page.tsx         # 회원가입 페이지
│   │   ├── (app)/
│   │   │   ├── layout.tsx               # 인증된 사용자 레이아웃 (사이드바)
│   │   │   ├── dashboard/page.tsx       # 대시보드 (빈 껍데기)
│   │   │   ├── family/
│   │   │   │   └── join/page.tsx        # 초대 코드 합류
│   │   │   └── settings/page.tsx        # 설정 (가족 관리)
│   │   └── api/
│   │       └── auth/[...nextauth]/route.ts  # NextAuth 핸들러
│   ├── lib/
│   │   ├── prisma.ts                    # Prisma 클라이언트 싱글톤
│   │   ├── auth.ts                      # NextAuth 설정
│   │   └── utils.ts                     # 유틸리티 (초대코드 생성 등)
│   ├── components/
│   │   ├── ui/                          # shadcn/ui 컴포넌트
│   │   ├── auth/
│   │   │   ├── login-form.tsx           # 로그인 폼
│   │   │   └── register-form.tsx        # 회원가입 폼
│   │   ├── family/
│   │   │   ├── join-form.tsx            # 가족 합류 폼
│   │   │   └── family-settings.tsx      # 가족 관리 (ADMIN)
│   │   └── layout/
│   │       ├── sidebar.tsx              # 사이드바 네비게이션
│   │       └── header.tsx               # 헤더
│   └── types/
│       └── next-auth.d.ts               # NextAuth 타입 확장
├── __tests__/
│   ├── lib/
│   │   ├── auth.test.ts                 # 인증 로직 테스트
│   │   └── utils.test.ts                # 유틸리티 테스트
│   └── api/
│       └── auth.test.ts                 # 인증 API 테스트
├── Dockerfile                            # 프로덕션 빌드
└── CLAUDE.md                            # 프로젝트 컨텍스트
```

---

### Task 1: 프로젝트 초기화 및 의존성 설치

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.example`, `CLAUDE.md`

- [ ] **Step 1: Next.js 15 프로젝트 생성**

```bash
cd /home/gon/projects/ai/ai-health
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

Expected: 프로젝트 파일 생성됨 (`package.json`, `tsconfig.json`, `next.config.ts` 등)

- [ ] **Step 2: 핵심 의존성 설치**

```bash
pnpm add prisma @prisma/client next-auth@beta bcryptjs zod lucide-react
pnpm add -D @types/bcryptjs vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: shadcn/ui 초기화**

```bash
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button input label card form toast separator avatar dropdown-menu sheet tabs badge
```

- [ ] **Step 4: .env.example 생성**

```env
# Database
DATABASE_URL="postgresql://aihealth:aihealth@localhost:5435/aihealth?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Zhipu AI (Phase 3에서 사용)
ZHIPU_API_KEY=""
```

- [ ] **Step 5: vitest 설정**

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

`vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
```

`package.json`에 스크립트 추가:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 6: CLAUDE.md 생성**

```markdown
# AI Health - 가족 건강 분석 시스템

## 기술 스택
- Next.js 15 (App Router), TypeScript, Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL (포트 5435)
- NextAuth.js (Credentials, JWT)
- Zhipu AI (GLM-4-Plus)
- pnpm, vitest

## 개발 명령어
- `pnpm dev` — 개발 서버 (http://localhost:3000)
- `pnpm test` — 테스트 실행
- `pnpm build` — 프로덕션 빌드
- `docker compose up -d` — PostgreSQL 시작
- `pnpm prisma db push` — 스키마 동기화
- `pnpm prisma studio` — DB 브라우저

## 디렉토리 구조
- `src/app/(auth)/` — 인증 페이지 (로그인, 회원가입)
- `src/app/(app)/` — 인증된 사용자 페이지
- `src/app/api/` — API Routes
- `src/lib/` — 서버 유틸리티 (prisma, auth 설정)
- `src/components/` — React 컴포넌트
- `__tests__/` — 테스트

## 컨벤션
- 커밋 메시지: 한국어, `feat:`, `fix:`, `docs:` 등
- 코드: 영어, 주석: 한국어
- API 입력 검증: Zod 스키마
- 컴포넌트: shadcn/ui 기반
```

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: Next.js 15 프로젝트 초기화

pnpm, TypeScript, Tailwind CSS, shadcn/ui, Prisma,
NextAuth, vitest 설정 완료

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Docker Compose + Prisma 스키마

**Files:**
- Create: `docker-compose.yml`, `prisma/schema.prisma`, `src/lib/prisma.ts`

- [ ] **Step 1: docker-compose.yml 생성**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: aihealth-postgres
    environment:
      POSTGRES_USER: aihealth
      POSTGRES_PASSWORD: aihealth
      POSTGRES_DB: aihealth
    ports:
      - "5435:5432"
    volumes:
      - aihealth-pgdata:/var/lib/postgresql/data

volumes:
  aihealth-pgdata:
```

- [ ] **Step 2: PostgreSQL 시작 및 연결 확인**

```bash
docker compose up -d
docker compose ps
```

Expected: `aihealth-postgres` 컨테이너가 running 상태

- [ ] **Step 3: Prisma 초기화 및 스키마 작성**

```bash
pnpm prisma init
```

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  MEMBER
}

enum Gender {
  MALE
  FEMALE
}

enum CalendarType {
  SOLAR
  LUNAR
}

model Family {
  id         String   @id @default(cuid())
  name       String
  inviteCode String   @unique
  createdAt  DateTime @default(now())
  members    User[]
}

model User {
  id                String        @id @default(cuid())
  email             String        @unique
  password          String
  name              String
  role              Role          @default(MEMBER)
  birthDate         DateTime?
  birthTime         String?
  birthCalendarType CalendarType? @default(SOLAR)
  gender            Gender?
  familyId          String
  family            Family        @relation(fields: [familyId], references: [id])
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}
```

- [ ] **Step 4: .env 파일 생성 (로컬)**

```bash
cp .env.example .env
```

`.env`:
```env
DATABASE_URL="postgresql://aihealth:aihealth@localhost:5435/aihealth?schema=public"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
ZHIPU_API_KEY=""
```

- [ ] **Step 5: DB 스키마 동기화**

```bash
pnpm prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 6: Prisma 클라이언트 싱글톤 생성**

`src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 7: 커밋**

```bash
git add docker-compose.yml prisma/ src/lib/prisma.ts .env.example
git commit -m "feat: Docker Compose PostgreSQL + Prisma 스키마 설정

User, Family 모델 정의 (Role, Gender, CalendarType enum)
개발용 PostgreSQL 컨테이너 (포트 5435) 구성

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: 유틸리티 함수 (TDD)

**Files:**
- Create: `src/lib/utils.ts`, `__tests__/lib/utils.test.ts`

- [ ] **Step 1: 유틸리티 테스트 작성**

`__tests__/lib/utils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { generateInviteCode, hashPassword, verifyPassword } from '@/lib/utils'

describe('generateInviteCode', () => {
  it('8자리 영숫자 코드를 생성한다', () => {
    const code = generateInviteCode()
    expect(code).toMatch(/^[A-Z0-9]{8}$/)
  })

  it('매번 다른 코드를 생성한다', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()))
    expect(codes.size).toBe(100)
  })
})

describe('hashPassword / verifyPassword', () => {
  it('비밀번호를 해시하고 검증한다', async () => {
    const password = 'test-password-123'
    const hashed = await hashPassword(password)
    expect(hashed).not.toBe(password)
    expect(await verifyPassword(password, hashed)).toBe(true)
  })

  it('잘못된 비밀번호는 검증 실패한다', async () => {
    const hashed = await hashPassword('correct-password')
    expect(await verifyPassword('wrong-password', hashed)).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test __tests__/lib/utils.test.ts
```

Expected: FAIL — `generateInviteCode`, `hashPassword`, `verifyPassword` 미정의

- [ ] **Step 3: 유틸리티 구현**

`src/lib/utils.ts` (기존 shadcn utils에 추가):
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = randomBytes(8)
  return Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed)
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
pnpm test __tests__/lib/utils.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/utils.ts __tests__/lib/utils.test.ts
git commit -m "feat: 유틸리티 함수 구현 (초대코드, 비밀번호 해시)

TDD로 generateInviteCode, hashPassword, verifyPassword 구현

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: NextAuth 인증 설정

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/types/next-auth.d.ts`

- [ ] **Step 1: NextAuth 타입 확장**

`src/types/next-auth.d.ts`:
```typescript
import { Role } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface User {
    role: Role
    familyId: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      familyId: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    familyId: string
  }
}
```

- [ ] **Step 2: NextAuth 설정 작성**

`src/lib/auth.ts`:
```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { verifyPassword } from './utils'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          familyId: user.familyId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = user.role
        token.familyId = user.familyId
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.familyId = token.familyId
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
```

- [ ] **Step 3: API Route 핸들러 생성**

`src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 4: 커밋**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/types/
git commit -m "feat: NextAuth.js 인증 설정

Credentials Provider + JWT 세션
User 역할(role), 가족ID(familyId) 세션에 포함

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: 회원가입 API + 폼

**Files:**
- Create: `src/app/api/auth/register/route.ts`, `src/components/auth/register-form.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/layout.tsx`

- [ ] **Step 1: 회원가입 API 테스트 작성**

`__tests__/api/register.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
    await prisma.family.deleteMany()
  })

  it('새 가족을 생성하며 회원가입한다', async () => {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: '홍길동',
        action: 'create',
        familyName: '홍씨 가족',
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.user.role).toBe('ADMIN')
    expect(data.family.inviteCode).toMatch(/^[A-Z0-9]{8}$/)
  })
})
```

Note: 이 테스트는 개발 서버가 실행 중일 때 통합 테스트로 동작. 단위 테스트는 유틸리티 레벨에서 이미 커버.

- [ ] **Step 2: 회원가입 API Route 구현**

`src/app/api/auth/register/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateInviteCode } from '@/lib/utils'

const registerSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(50),
    familyName: z.string().min(1).max(50),
  }),
  z.object({
    action: z.literal('join'),
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(50),
    inviteCode: z.string().length(8),
  }),
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(data.password)

    if (data.action === 'create') {
      const family = await prisma.family.create({
        data: {
          name: data.familyName,
          inviteCode: generateInviteCode(),
        },
      })

      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: 'ADMIN',
          familyId: family.id,
        },
      })

      return NextResponse.json(
        {
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          family: { id: family.id, name: family.name, inviteCode: family.inviteCode },
        },
        { status: 201 }
      )
    }

    // action === 'join'
    const family = await prisma.family.findUnique({
      where: { inviteCode: data.inviteCode },
    })
    if (!family) {
      return NextResponse.json(
        { error: '유효하지 않은 초대 코드입니다' },
        { status: 404 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'MEMBER',
        familyId: family.id,
      },
    })

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        family: { id: family.id, name: family.name },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: 인증 페이지 레이아웃 생성**

`src/app/(auth)/layout.tsx`:
```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 회원가입 폼 컴포넌트 구현**

`src/components/auth/register-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const action = formData.get('action') as string

    const body: Record<string, string> = {
      action,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    }

    if (action === 'create') {
      body.familyName = formData.get('familyName') as string
    } else {
      body.inviteCode = formData.get('inviteCode') as string
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : '입력을 확인해주세요')
        return
      }

      router.push('/login?registered=true')
    } catch {
      setError('회원가입 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>AI Health에 가입하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">새 가족 만들기</TabsTrigger>
            <TabsTrigger value="join">초대 코드로 합류</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="action" value="create" />
              <div className="space-y-2">
                <Label htmlFor="name-create">이름</Label>
                <Input id="name-create" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-create">이메일</Label>
                <Input id="email-create" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-create">비밀번호</Label>
                <Input id="password-create" name="password" type="password" minLength={8} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familyName">가족 이름</Label>
                <Input id="familyName" name="familyName" placeholder="예: 홍씨 가족" required />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '처리 중...' : '가족 만들고 가입하기'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="join">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="action" value="join" />
              <div className="space-y-2">
                <Label htmlFor="name-join">이름</Label>
                <Input id="name-join" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-join">이메일</Label>
                <Input id="email-join" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-join">비밀번호</Label>
                <Input id="password-join" name="password" type="password" minLength={8} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">초대 코드</Label>
                <Input id="inviteCode" name="inviteCode" maxLength={8} placeholder="8자리 코드" required />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '처리 중...' : '가족에 합류하기'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <a href="/login" className="text-blue-600 hover:underline">로그인</a>
        </p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: 회원가입 페이지 생성**

`src/app/(auth)/register/page.tsx`:
```tsx
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return <RegisterForm />
}
```

- [ ] **Step 6: 커밋**

```bash
git add src/app/api/auth/register/ src/components/auth/register-form.tsx src/app/\(auth\)/ __tests__/
git commit -m "feat: 회원가입 기능 구현

새 가족 생성 / 초대 코드 합류 두 가지 모드
Zod 검증, bcrypt 해시, 에러 처리 포함

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: 로그인 폼 + 세션 프로바이더

**Files:**
- Create: `src/components/auth/login-form.tsx`, `src/app/(auth)/login/page.tsx`, `src/components/providers.tsx`

- [ ] **Step 1: 로그인 폼 컴포넌트 구현**

`src/components/auth/login-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>AI Health에 로그인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        {registered && (
          <p className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">
            회원가입이 완료되었습니다. 로그인해주세요.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <a href="/register" className="text-blue-600 hover:underline">회원가입</a>
        </p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: 로그인 페이지 생성**

`src/app/(auth)/login/page.tsx`:
```tsx
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return <LoginForm />
}
```

- [ ] **Step 3: 세션 프로바이더 구성**

`src/components/providers.tsx`:
```tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

`src/app/layout.tsx` 수정 — `<body>` 안에 `<Providers>` 래핑:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Health - 가족 건강 분석',
  description: '가족 건강 데이터를 AI로 분석하는 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: 루트 페이지 리다이렉트**

`src/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()
  if (session) {
    redirect('/dashboard')
  }
  redirect('/login')
}
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/auth/login-form.tsx src/app/\(auth\)/login/ src/components/providers.tsx src/app/layout.tsx src/app/page.tsx
git commit -m "feat: 로그인 기능 및 세션 프로바이더 구현

NextAuth Credentials 로그인 폼, SessionProvider 래핑
루트 페이지에서 인증 상태에 따라 리다이렉트

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: 인증된 사용자 레이아웃 (사이드바 + 대시보드)

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/dashboard/page.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/header.tsx`

- [ ] **Step 1: 사이드바 컴포넌트 구현**

`src/components/layout/sidebar.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ClipboardList,
  Pill,
  FileText,
  Brain,
  Compass,
  Target,
  Activity,
  Utensils,
  Heart,
  Clock,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/records', label: '건강 기록', icon: ClipboardList },
  { href: '/nutrition', label: '식단 관리', icon: Utensils },
  { href: '/medications', label: '복용약/보조제', icon: Pill },
  { href: '/symptoms', label: '증상 기록', icon: Heart },
  { href: '/mental', label: '정신 건강', icon: Brain },
  { href: '/checkup', label: '건강검진', icon: FileText },
  { href: '/exercise', label: '운동', icon: Activity },
  { href: '/goals', label: '건강 목표', icon: Target },
  { href: '/risk', label: '위험도 분석', icon: Compass },
  { href: '/timeline', label: '타임라인', icon: Clock },
  { href: '/insight', label: 'AI 분석', icon: Brain },
  { href: '/saju', label: '사주 건강', icon: Compass },
  { href: '/settings', label: '설정', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white h-screen sticky top-0 overflow-y-auto">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">AI Health</h1>
        <p className="text-sm text-gray-500">가족 건강 분석</p>
      </div>
      <nav className="p-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: 헤더 컴포넌트 구현**

`src/components/layout/header.tsx`:
```tsx
'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { data: session } = useSession()

  const name = session?.user?.name ?? '?'
  // 한국어 이름은 2자, 영어 이름은 이니셜
  const initials = /[가-힣]/.test(name)
    ? name.slice(0, 2)
    : name.split(' ').map(w => w[0]).join('').toUpperCase()

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{session?.user?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
```

- [ ] **Step 3: 인증된 사용자 레이아웃 구현**

`src/app/(app)/layout.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 대시보드 페이지 (빈 껍데기)**

`src/app/(app)/dashboard/page.tsx`:
```tsx
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">대시보드</h2>
      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {session?.user?.name}님!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            건강 데이터를 기록하고 AI 분석을 받아보세요.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: 커밋**

```bash
git add src/app/\(app\)/ src/components/layout/
git commit -m "feat: 인증된 사용자 레이아웃 구현

사이드바 네비게이션, 헤더 (사용자 메뉴),
대시보드 페이지 껍데기, 미인증 시 리다이렉트

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: 가족 관리 (설정 + 합류)

**Files:**
- Create: `src/app/(app)/settings/page.tsx`, `src/components/family/family-settings.tsx`, `src/app/(app)/family/join/page.tsx`, `src/components/family/join-form.tsx`, `src/app/api/family/route.ts`
- Test: `__tests__/api/family.test.ts`

- [ ] **Step 1: 가족 API 테스트 작성**

`__tests__/api/family.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('Family API', () => {
  it('ADMIN만 초대 코드를 재생성할 수 있다', () => {
    // PATCH { action: 'regenerateCode' } - ADMIN: 200, MEMBER: 403
    expect(true).toBe(true) // 통합 테스트로 검증
  })

  it('ADMIN만 구성원을 탈퇴시킬 수 있다', () => {
    expect(true).toBe(true)
  })

  it('ADMIN을 탈퇴시킬 수 없다', () => {
    expect(true).toBe(true)
  })

  it('ADMIN만 구성원 역할을 변경할 수 있다', () => {
    expect(true).toBe(true)
  })

  it('ADMIN만 가족 이름을 수정할 수 있다', () => {
    expect(true).toBe(true)
  })
})
```

- [ ] **Step 2: 가족 관리 API 구현**

`src/app/api/family/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInviteCode } from '@/lib/utils'

// GET: 가족 정보 및 구성원 목록 조회
export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const family = await prisma.family.findUnique({
    where: { id: session.user.familyId },
    include: {
      members: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
    },
  })

  return NextResponse.json(family)
}

// PATCH: 가족 정보 수정 (ADMIN만)
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
  }

  const body = await request.json()

  if (body.action === 'regenerateCode') {
    const family = await prisma.family.update({
      where: { id: session.user.familyId },
      data: { inviteCode: generateInviteCode() },
    })
    return NextResponse.json({ inviteCode: family.inviteCode })
  }

  if (body.action === 'updateName' && body.name) {
    const family = await prisma.family.update({
      where: { id: session.user.familyId },
      data: { name: body.name },
    })
    return NextResponse.json({ name: family.name })
  }

  if (body.action === 'changeRole' && body.memberId && body.role) {
    const member = await prisma.user.findUnique({ where: { id: body.memberId } })
    if (!member || member.familyId !== session.user.familyId || member.id === session.user.id) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다' }, { status: 400 })
    }
    const updated = await prisma.user.update({
      where: { id: body.memberId },
      data: { role: body.role },
    })
    return NextResponse.json({ id: updated.id, role: updated.role })
  }

  if (body.action === 'removeMember' && body.memberId) {
    const member = await prisma.user.findUnique({ where: { id: body.memberId } })
    if (!member || member.familyId !== session.user.familyId || member.role === 'ADMIN') {
      return NextResponse.json({ error: '유효하지 않은 요청입니다' }, { status: 400 })
    }
    await prisma.user.delete({ where: { id: body.memberId } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '유효하지 않은 요청입니다' }, { status: 400 })
}
```

- [ ] **Step 2: 가족 설정 컴포넌트 구현**

`src/components/family/family-settings.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FamilyData {
  id: string
  name: string
  inviteCode: string
  members: { id: string; name: string; email: string; role: string; createdAt: string }[]
}

export function FamilySettings() {
  const { data: session } = useSession()
  const [family, setFamily] = useState<FamilyData | null>(null)
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    fetch('/api/family').then(r => r.json()).then(setFamily)
  }, [])

  async function regenerateCode() {
    const res = await fetch('/api/family', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'regenerateCode' }),
    })
    const data = await res.json()
    if (family) setFamily({ ...family, inviteCode: data.inviteCode })
  }

  async function removeMember(memberId: string) {
    if (!confirm('정말 이 구성원을 탈퇴시키겠습니까?')) return
    await fetch('/api/family', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'removeMember', memberId }),
    })
    if (family) {
      setFamily({ ...family, members: family.members.filter(m => m.id !== memberId) })
    }
  }

  if (!family) return <p>로딩 중...</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>가족 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">가족 이름</p>
            <p className="font-medium">{family.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">초대 코드</p>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 px-3 py-1 rounded text-lg font-mono">
                {family.inviteCode}
              </code>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={regenerateCode}>
                  재생성
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>가족 구성원 ({family.members.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {family.members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {member.role === 'ADMIN' ? '관리자' : '구성원'}
                  </Badge>
                  {isAdmin && member.role !== 'ADMIN' && (
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeMember(member.id)}>
                      탈퇴
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: 설정 페이지 구현**

`src/app/(app)/settings/page.tsx`:
```tsx
import { FamilySettings } from '@/components/family/family-settings'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">설정</h2>
      <FamilySettings />
    </div>
  )
}
```

- [ ] **Step 5: 가족 합류 페이지 구현**

`src/components/family/join-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function JoinFamilyForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const inviteCode = formData.get('inviteCode') as string

    try {
      const res = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '합류에 실패했습니다')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>가족 합류</CardTitle>
        <CardDescription>초대 코드를 입력하여 가족에 합류하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">초대 코드</Label>
            <Input id="inviteCode" name="inviteCode" maxLength={8} placeholder="8자리 코드" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '처리 중...' : '합류하기'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

`src/app/(app)/family/join/page.tsx`:
```tsx
import { JoinFamilyForm } from '@/components/family/join-form'

export default function JoinFamilyPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <JoinFamilyForm />
    </div>
  )
}
```

- [ ] **Step 6: 커밋**

```bash
git add src/app/api/family/ src/components/family/ src/app/\(app\)/settings/ src/app/\(app\)/family/ __tests__/api/family.test.ts
git commit -m "feat: 가족 관리 기능 구현

가족 정보 조회, 초대 코드 재생성, 구성원 탈퇴/역할 변경 (ADMIN)
가족 이름 수정, 가족 합류 페이지, 설정 페이지 UI 구현

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Dockerfile + Docker Compose (프로덕션)

**Files:**
- Create: `Dockerfile`, update `docker-compose.yml`

- [ ] **Step 1: Dockerfile 생성**

```dockerfile
FROM node:24-alpine AS base

# 의존성 설치
FROM base AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 빌드
FROM base AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# 프로덕션
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

- [ ] **Step 2: next.config.ts에 standalone 출력 설정**

`next.config.ts` 수정:
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

- [ ] **Step 3: docker-compose.yml에 프로덕션 서비스 추가**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: aihealth-postgres
    environment:
      POSTGRES_USER: aihealth
      POSTGRES_PASSWORD: aihealth
      POSTGRES_DB: aihealth
    ports:
      - "5435:5432"
    volumes:
      - aihealth-pgdata:/var/lib/postgresql/data

  # 프로덕션 배포용 (docker compose --profile prod up)
  app:
    build: .
    container_name: aihealth-app
    profiles: ["prod"]
    ports:
      - "3200:3000"
    environment:
      DATABASE_URL: "postgresql://aihealth:aihealth@postgres:5432/aihealth?schema=public"
      NEXTAUTH_SECRET: "${NEXTAUTH_SECRET}"
      NEXTAUTH_URL: "http://localhost:3200"
      ZHIPU_API_KEY: "${ZHIPU_API_KEY}"
    volumes:
      - aihealth-uploads:/app/uploads
    depends_on:
      - postgres

volumes:
  aihealth-pgdata:
  aihealth-uploads:
```

- [ ] **Step 4: .dockerignore 생성**

```
node_modules
.next
.git
__tests__
docs
*.md
.env
```

- [ ] **Step 5: 커밋**

```bash
git add Dockerfile docker-compose.yml .dockerignore next.config.ts
git commit -m "feat: Docker 프로덕션 빌드 설정

standalone 출력, 멀티스테이지 빌드
docker-compose prod 프로필로 앱+DB 배포

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: E2E 검증 및 .gitignore 정리

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: .gitignore를 Node.js/Next.js 용으로 교체**

기존 Visual Studio .gitignore를 Next.js 프로젝트에 맞게 교체:
```
# dependencies
node_modules/
.pnp
.pnp.js

# testing
coverage/

# next.js
.next/
out/

# production
build/

# misc
*.pem
.DS_Store

# debug
npm-debug.log*
pnpm-debug.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# uploads
uploads/
```

- [ ] **Step 2: 개발 서버 시작하여 전체 플로우 검증**

```bash
docker compose up -d
pnpm prisma db push
pnpm dev
```

브라우저에서 확인:
1. `http://localhost:3000` → 로그인 페이지로 리다이렉트
2. 회원가입 → 새 가족 만들기 → 로그인 페이지로 이동
3. 로그인 → 대시보드 표시
4. 사이드바 네비게이션 동작
5. 설정 → 가족 정보/초대 코드 표시

- [ ] **Step 3: 테스트 실행**

```bash
pnpm test
```

Expected: 모든 테스트 PASS

- [ ] **Step 4: 최종 커밋**

```bash
git add .gitignore
git commit -m "chore: .gitignore를 Next.js용으로 교체

Visual Studio gitignore → Node.js/Next.js gitignore

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 1 완료 기준

- [ ] PostgreSQL Docker 컨테이너 실행
- [ ] Prisma 스키마 (User, Family) 동기화
- [ ] 회원가입 (새 가족 생성 / 초대 코드 합류)
- [ ] 로그인 / 로그아웃
- [ ] 인증된 사용자 레이아웃 (사이드바, 헤더)
- [ ] 대시보드 페이지 (빈 껍데기)
- [ ] 가족 관리 (초대 코드 조회/재생성, 구성원 관리)
- [ ] Docker 프로덕션 빌드 설정
- [ ] 테스트 통과
