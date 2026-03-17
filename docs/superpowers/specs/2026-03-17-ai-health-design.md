# AI Health - 가족 건강 분석 시스템 설계

## 개요

가족/소규모 그룹이 건강 데이터(신체 측정, 바이탈 사인, 활동/생활습관)를 수동 입력하고, Zhipu AI를 통해 자연어 인사이트를 받는 웹 애플리케이션.

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| ORM | Prisma |
| DB | PostgreSQL |
| 인증 | NextAuth.js (Credentials Provider, JWT) |
| AI | Zhipu AI (GLM-4-Plus 또는 최신 가용 모델) |
| UI | Tailwind CSS + shadcn/ui |
| 유효성 검증 | Zod |
| 단위 체계 | Metric (kg, cm, °C, mmHg) |
| 패키지 매니저 | pnpm |
| 배포 | Docker → 홈서버(192.168.0.5), 포트 3200 |

## 1. 아키텍처

```
[브라우저] → [Next.js App]
                ├── Pages (App Router)
                │   ├── 로그인/회원가입
                │   ├── 대시보드 (가족 전체 요약)
                │   ├── 건강 데이터 입력/조회
                │   └── AI 인사이트
                ├── API Routes
                │   ├── /api/auth/* (NextAuth)
                │   ├── /api/health/* (건강 데이터 CRUD)
                │   └── /api/insight/* (Zhipu AI 분석 요청)
                ├── Prisma ORM → PostgreSQL
                └── Zhipu AI API
```

- 단일 Next.js 앱이 프론트엔드와 백엔드를 모두 담당
- API Routes로 건강 데이터 CRUD와 AI 인사이트 엔드포인트 제공
- Zhipu AI에 사용자 건강 데이터를 전달하여 자연어 분석 결과를 받음

## 2. 데이터 모델

### User
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| email | String | 로그인 이메일 (unique) |
| password | String | 해시된 비밀번호 |
| name | String | 표시 이름 |
| role | Enum (ADMIN, MEMBER) | 가족 내 역할 |
| birthDate | DateTime? | 생년월일 |
| gender | Enum? (MALE, FEMALE) | 성별 |
| familyId | String | FK → Family |

### Family
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| name | String | 가족 이름 |
| inviteCode | String | 초대 코드 (unique) |
| createdAt | DateTime | 생성일 |

### HealthRecord
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| type | Enum (BODY_MEASURE, VITAL_SIGN, ACTIVITY) | 기록 카테고리 |
| data | Json | 건강 데이터 (유연한 JSON 구조) |
| recordedAt | DateTime | 측정 일시 |
| createdAt | DateTime | 입력 일시 |

#### data 필드 예시

**BODY_MEASURE:**
```json
{ "weight": 72.5, "height": 175, "bodyFat": 18.2 }
```

**VITAL_SIGN:**
```json
{ "systolic": 120, "diastolic": 80, "heartRate": 72, "bloodSugar": 95, "temperature": 36.5 }
```

**ACTIVITY:**
```json
{ "steps": 8500, "sleepHours": 7.5, "exercise": "달리기", "duration": 30 }
```

### InsightHistory
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| prompt | String | AI에 전송한 프롬프트 |
| response | String | AI 응답 (자연어 인사이트) |
| fromDate | DateTime | 분석 시작일 |
| toDate | DateTime | 분석 종료일 |
| createdAt | DateTime | 생성일 |

## 3. 데이터 유효성 범위

| 카테고리 | 필드 | 최소 | 최대 | 단위 |
|----------|------|------|------|------|
| BODY_MEASURE | weight | 1 | 300 | kg |
| BODY_MEASURE | height | 30 | 250 | cm |
| BODY_MEASURE | bodyFat | 1 | 60 | % |
| VITAL_SIGN | systolic | 60 | 250 | mmHg |
| VITAL_SIGN | diastolic | 30 | 150 | mmHg |
| VITAL_SIGN | heartRate | 30 | 220 | bpm |
| VITAL_SIGN | bloodSugar | 20 | 600 | mg/dL |
| VITAL_SIGN | temperature | 34 | 42 | °C |
| ACTIVITY | steps | 0 | 100000 | 걸음 |
| ACTIVITY | sleepHours | 0 | 24 | 시간 |
| ACTIVITY | duration | 0 | 1440 | 분 |

- BMI는 사용자 입력이 아닌 weight/height로 서버에서 자동 계산
- `exercise` 필드: 자유 텍스트, 최대 50자
- 각 type별 Zod 스키마를 분리 정의하여 API 입력 시 검증

## 4. 인증 및 사용자 관리

- NextAuth.js + Credentials Provider (이메일/비밀번호)
- 비밀번호는 bcrypt로 해시 저장
- 세션: JWT 기반

### 회원가입 플로우
1. `/register`에서 이메일/비밀번호/이름 입력
2. **"새 가족 만들기"** 또는 **"초대 코드로 합류"** 선택
   - 새 가족 만들기 → 가족 이름 입력, 자동으로 inviteCode 생성, 역할 = ADMIN
   - 초대 코드로 합류 → 코드 입력, 역할 = MEMBER

### 역할 및 권한
| 권한 | ADMIN | MEMBER |
|------|-------|--------|
| 본인 건강 데이터 CRUD | O | O |
| 가족 구성원 데이터 조회 | O | O |
| AI 인사이트 요청 | O | O |
| 구성원 역할 변경 | O | X |
| 구성원 강제 탈퇴 | O | X |
| 초대 코드 재생성 | O | X |
| 가족 정보 수정 | O | X |

### 데이터 가시성 정책
- 같은 가족 구성원은 서로의 모든 건강 기록을 조회 가능
- 대시보드에서 가족 전체 요약 표시
- 가족 외 사용자에게는 어떤 데이터도 노출되지 않음

## 5. AI 인사이트 흐름

```
사용자 "분석 요청" 클릭
  → API Route: 최근 30일간 HealthRecord 조회 (기간 조정 가능)
  → 데이터를 구조화된 프롬프트로 변환
  → Zhipu AI API 호출
  → 자연어 인사이트 응답 반환
  → InsightHistory에 저장
  → 사용자에게 표시
```

- 프롬프트 전략: 건강 데이터를 표 형태로 정리 + 건강 전문가 시스템 프롬프트
- 분석 범위: 개인별 또는 가족 전체 비교 분석 가능
- 기본 분석 기간: 30일 (사용자가 기간 조정 가능)
- 비용 관리: 일일 요청 횟수 제한 (가족 단위, 10회/일 — InsightHistory.createdAt 기준 count)

## 6. 페이지 구성

| 페이지 | 기능 |
|--------|------|
| `/login`, `/register` | 로그인, 회원가입 |
| `/family/join` | 초대 코드로 가족 합류 |
| `/dashboard` | 가족 전체 요약 (최근 기록, 간단 통계) |
| `/records/new` | 건강 데이터 입력 (타입 선택 → 항목 입력) |
| `/records` | 본인 건강 기록 목록/필터 |
| `/insight` | AI 분석 요청 및 과거 인사이트 조회 |
| `/settings` | 프로필 수정, 가족 관리 (ADMIN) |

## 7. 에러 처리 및 보안

- Zhipu AI API 호출 실패 시: "분석을 일시적으로 수행할 수 없습니다" 메시지 반환
- API 키는 환경 변수(ZHIPU_API_KEY)로 관리
- 건강 데이터 접근: 같은 가족 구성원만 조회 가능 (API Route에서 familyId 검증)
- 입력 유효성: Zod 스키마로 API 입력 검증

## 8. 배포 구성

- Docker Compose: Next.js 앱 + 새 PostgreSQL 인스턴스 (포트 5435)
- 포트: 3200 (기존 서비스 3100, 5678, 8081, 8082, 8088과 충돌 없음)
- 환경 변수: .env로 DB URL, Zhipu API 키, NextAuth 시크릿 관리
- standalone 빌드로 Docker 이미지 최적화
