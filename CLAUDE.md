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
