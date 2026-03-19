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

## 디렉토리 구조 (FSD 아키텍처)

이 프로젝트는 FSD(Feature-Sliced Design) 구조를 사용합니다.

```
src/
├── app/              # Next.js 라우팅 + 레이아웃만 (비즈니스 로직 없음)
│   ├── (auth)/       # 인증 페이지 (로그인, 회원가입)
│   ├── (app)/        # 인증된 사용자 페이지
│   └── api/          # API Routes
├── widgets/          # 여러 feature를 조합하는 컴포넌트
│   ├── layout/       # Sidebar, Header
│   └── dashboard/    # 대시보드 (통계, 계절 카드)
├── features/         # 기능 단위 (도메인별)
│   ├── auth/         # 로그인, 회원가입 폼
│   ├── health-record/ # 건강 기록 CRUD + validation + 7개 서브타입
│   ├── insight/      # AI 분석 UI + 프롬프트
│   ├── checkup/      # 건강검진 PDF 업로드
│   ├── goals/        # 건강 목표
│   ├── saju/         # 사주 건강 분석
│   ├── family/       # 가족 관리
│   ├── exercise/     # 운동 전용 뷰
│   ├── nutrition/    # 식단 전용 뷰
│   ├── medications/  # 복약 전용 뷰
│   ├── risk/         # 위험도 분석
│   ├── timeline/     # 건강 타임라인
│   └── settings/     # 프로필 설정
├── entities/         # 비즈니스 엔티티
│   └── user/         # User 타입
├── shared/           # 공유 리소스
│   ├── ui/           # shadcn/ui 컴포넌트
│   ├── lib/          # auth, prisma, cn, password 등
│   ├── api/          # Zhipu AI 클라이언트
│   ├── config/       # 상수 (DAILY_LIMIT 등)
│   └── providers/    # SessionProvider
└── __tests__/        # 테스트
```

### FSD 의존성 규칙
`app → widgets → features → entities → shared` (상위 → 하위만 참조)

- 각 slice는 `index.ts`로 public API 노출
- 외부에서는 반드시 `index.ts`를 통해 import
- feature 간 직접 import 금지 (widgets에서 조합)
- API routes는 FSD 레이어 규칙 예외 (필요한 곳에서 직접 import)

## 컨벤션
- 커밋 메시지: 한국어, `feat:`, `fix:`, `docs:` 등
- 코드: 영어, 주석: 한국어
- API 입력 검증: Zod 스키마
- 컴포넌트: shadcn/ui 기반 (`shared/ui/`)
- 새 shadcn 컴포넌트 추가: `components.json` alias가 `@/shared/ui`를 가리킴
