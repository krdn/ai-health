# AI Health - 가족 건강 분석 시스템 설계

## 개요

가족/소규모 그룹이 건강 데이터(신체 측정, 바이탈 사인, 활동/생활습관)를 수동 입력하고, Zhipu AI를 통해 자연어 인사이트를 받는 웹 애플리케이션. 건강검진 PDF 문서를 업로드하여 AI가 검진 결과를 분석하고, 생년월일시 기반 사주(四柱) 분석을 통해 체질별 건강 취약점과 맞춤 양생법도 제공.

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
| PDF 파싱 | pdf-parse |
| 파일 저장 | 로컬 볼륨 (Docker volume) |
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
                │   ├── AI 인사이트 (종합/운동/영양/위험도/상관관계)
                │   ├── 건강검진 PDF 업로드/분석
                │   ├── 건강 목표 관리
                │   └── 사주 건강 분석
                ├── API Routes
                │   ├── /api/auth/* (NextAuth)
                │   ├── /api/health/* (건강 데이터 CRUD)
                │   ├── /api/checkup/* (건강검진 PDF 업로드/분석)
                │   ├── /api/goals/* (건강 목표 CRUD)
                │   ├── /api/insight/* (AI 분석 — 모든 유형)
                │   └── /api/saju/* (사주 건강 분석)
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
| birthTime | String? | 출생 시각 (HH:mm, 사주 분석용) |
| birthCalendarType | Enum? (SOLAR, LUNAR) | 양력/음력 구분 (기본: SOLAR) |
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
| type | Enum (BODY_MEASURE, VITAL_SIGN, ACTIVITY, MEDICATION, NUTRITION, SYMPTOM, MENTAL) | 기록 카테고리 |
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

**MEDICATION (복용약/건강보조제):**
```json
{
  "name": "오메가3",
  "category": "SUPPLEMENT",
  "dosage": "1000mg",
  "frequency": "1일 1회",
  "startDate": "2026-01-15",
  "endDate": null,
  "notes": "식후 복용"
}
```

#### MEDICATION category 값
| 값 | 설명 |
|------|------|
| PRESCRIPTION | 처방약 |
| OTC | 일반의약품 (비처방) |
| SUPPLEMENT | 건강보조제/영양제 |

**NUTRITION (식단/영양 기록):**
```json
{
  "meal": "LUNCH",
  "description": "현미밥, 된장찌개, 고등어구이, 시금치나물",
  "calories": 650,
  "protein": 35,
  "carbs": 80,
  "fat": 18,
  "fiber": 8,
  "sodium": 1200,
  "water": 500
}
```

#### NUTRITION meal 값
| 값 | 설명 |
|------|------|
| BREAKFAST | 아침 |
| LUNCH | 점심 |
| DINNER | 저녁 |
| SNACK | 간식 |

**SYMPTOM (증상 기록):**
```json
{
  "symptom": "두통",
  "severity": 6,
  "location": "후두부",
  "duration": 120,
  "trigger": "수면 부족",
  "notes": "진통제 복용 후 1시간 내 완화"
}
```
- `severity`: 1~10 (주관적 통증/불편 수준)
- `duration`: 분 단위
- `trigger`: 자유 텍스트, 최대 100자

**MENTAL (정신 건강 기록):**
```json
{
  "mood": 7,
  "stressLevel": 4,
  "anxietyLevel": 3,
  "energyLevel": 6,
  "sleepQuality": 7,
  "notes": "업무 마감 스트레스"
}
```
- 모든 수치: 1~10 척도 (1=최저, 10=최고)

### CheckupRecord
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| fileName | String | 원본 파일명 |
| filePath | String | 서버 저장 경로 |
| fileSize | Int | 파일 크기 (bytes) |
| checkupDate | DateTime | 검진 날짜 |
| institution | String? | 검진 기관명 |
| extractedData | Json? | PDF에서 추출한 구조화된 검진 데이터 |
| summary | String? | AI가 생성한 검진 결과 요약 |
| createdAt | DateTime | 업로드 일시 |

#### extractedData 예시
```json
{
  "general": { "height": 175, "weight": 72.5, "bmi": 23.7, "waist": 82 },
  "bloodTest": { "hemoglobin": 15.2, "glucose": 95, "cholesterol": 185, "hdl": 55, "ldl": 110, "triglyceride": 120 },
  "bloodPressure": { "systolic": 120, "diastolic": 78 },
  "liver": { "ast": 25, "alt": 22, "ggt": 35 },
  "kidney": { "creatinine": 0.9, "gfr": 95 },
  "findings": ["경미한 지방간", "정상 혈압"],
  "recommendations": ["체중 관리 권장", "6개월 후 재검"]
}
```

### InsightHistory
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| type | Enum (HEALTH, SAJU, CHECKUP, SUPPLEMENT_REC, SIDE_EFFECT, RISK_ASSESSMENT, EXERCISE_RX, NUTRITION_ANALYSIS, CORRELATION, SEASONAL, FAMILY_PATTERN, COMBINED) | 분석 유형 |
| prompt | String | AI에 전송한 프롬프트 |
| response | String | AI 응답 (자연어 인사이트) |
| fromDate | DateTime? | 분석 시작일 (HEALTH, COMBINED) |
| toDate | DateTime? | 분석 종료일 (HEALTH, COMBINED) |
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
| NUTRITION | calories | 0 | 5000 | kcal |
| NUTRITION | protein | 0 | 500 | g |
| NUTRITION | carbs | 0 | 1000 | g |
| NUTRITION | fat | 0 | 500 | g |
| NUTRITION | sodium | 0 | 10000 | mg |
| NUTRITION | water | 0 | 5000 | ml |
| SYMPTOM | severity | 1 | 10 | 척도 |
| SYMPTOM | duration | 0 | 10080 | 분 |
| MENTAL | mood | 1 | 10 | 척도 |
| MENTAL | stressLevel | 1 | 10 | 척도 |
| MENTAL | anxietyLevel | 1 | 10 | 척도 |
| MENTAL | energyLevel | 1 | 10 | 척도 |
| MENTAL | sleepQuality | 1 | 10 | 척도 |

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

- 프롬프트 전략: 건강 데이터 + 복용약/보조제 + 검진 결과를 표 형태로 정리 + 건강 전문가 시스템 프롬프트
- 복용약 교차 분석: 약물 간 상호작용, 영양제 과다 복용 주의 등 AI가 분석
- 분석 범위: 개인별 또는 가족 전체 비교 분석 가능
- 기본 분석 기간: 30일 (사용자가 기간 조정 가능)
- 비용 관리: 일일 요청 횟수 제한 (가족 단위, 10회/일 — InsightHistory.createdAt 기준 count)

### 보조제 추천 분석

```
보조제 추천 요청
  → 사용자의 건강 데이터 + 검진 결과 + 현재 복용약 목록 수집
  → Zhipu AI에 전달 (건강 전문가 + 영양학 시스템 프롬프트)
  → 건강 상태 기반 부족 영양소 파악
  → 현재 복용 중인 보조제와 중복/과다 여부 확인
  → 추천 보조제 목록 + 근거 반환
  → InsightHistory에 저장 (type: SUPPLEMENT_REC)
```

AI 분석 내용:
- **부족 영양소 분석**: 검진 수치(헤모글로빈 부족 → 철분, 비타민D 수치 낮음 → 비타민D 등)
- **체질 기반 추천**: 사주 오행 균형과 연계한 보조제 추천
- **복용 중 보조제 평가**: 현재 복용량 적정 여부, 불필요한 보조제 알림
- **주의사항**: 처방약과의 상호작용 경고 (예: 혈전용해제 + 오메가3)

### 처방약 부작용 분석

```
부작용 분석 요청
  → 사용자의 복용약 목록 (PRESCRIPTION) 수집
  → 최근 건강 데이터 변화 추세 조회
  → Zhipu AI에 전달 (약학 전문가 시스템 프롬프트)
  → 분석 결과 반환
  → InsightHistory에 저장 (type: SIDE_EFFECT)
```

AI 분석 내용:
- **알려진 부작용 안내**: 각 처방약의 주요 부작용 목록
- **약물 간 상호작용**: 복수 약물 병용 시 위험한 조합 경고
- **건강 데이터 연관 분석**: 약 복용 시작 후 건강 수치 변화와 부작용 연관성 탐지
  - 예: "스타틴 복용 시작(2026-02) 이후 간 수치(AST/ALT) 상승 추세 감지"
- **처방약-보조제 충돌**: 처방약과 건강보조제 간 상호작용 경고
  - 예: "와파린 복용 중 비타민K 보조제는 약효를 감소시킬 수 있습니다"

### 면책 조항
> 본 시스템의 AI 분석은 참고용이며 의학적 진단이나 처방을 대체하지 않습니다. 약물 변경이나 건강 관련 결정은 반드시 의료 전문가와 상담하세요.

모든 AI 인사이트 응답 하단에 위 면책 조항을 자동 표시.

## 6. 건강검진 PDF 분석

### 업로드 및 분석 흐름

```
사용자 PDF 업로드
  → 파일 유효성 검증 (PDF, 최대 20MB)
  → 로컬 볼륨에 저장 (uploads/<userId>/<timestamp>-<filename>)
  → pdf-parse로 텍스트 추출
  → Zhipu AI에 추출 텍스트 전달하여 구조화된 데이터 추출
  → extractedData (Json) 및 summary 저장
  → 사용자에게 구조화된 검진 결과 및 AI 요약 표시
```

### 파일 관리
- **저장 위치**: Docker volume (`/app/uploads`)으로 마운트
- **파일 제한**: PDF만 허용, 최대 20MB
- **경로 구조**: `uploads/<userId>/<timestamp>-<originalName>.pdf`
- **보안**: 파일 경로는 DB에만 저장, API를 통해서만 접근 (직접 URL 노출 없음)

### AI 분석 전략
1. **텍스트 추출**: pdf-parse로 PDF 전체 텍스트 추출
2. **구조화 요청**: Zhipu AI에 "건강검진 결과 문서를 분석하여 JSON 형태로 구조화해주세요" 프롬프트
3. **요약 생성**: 주요 소견, 이상 수치, 권고사항을 자연어로 요약
4. **연간 비교**: 여러 검진 기록이 있을 경우 연도별 추세 분석 가능

### InsightHistory 연동
- 검진 결과 기반 AI 분석 요청 시 `type: CHECKUP` 으로 저장
- 건강 데이터 + 검진 결과 + 사주를 결합한 종합 분석도 가능

## 7. 사주(四柱) 건강 분석


### 개요
사용자의 생년월일시를 기반으로 사주팔자를 산출하고, 오행(五行) 균형에 따른 체질별 건강 취약점과 양생법을 AI가 분석하여 제공.

### 분석 흐름

```
사주 분석 요청
  → 사용자 birthDate + birthTime + birthCalendarType 확인
  → 음력인 경우 양력으로 변환
  → 사주팔자(년주, 월주, 일주, 시주) 산출
  → 오행 분포 계산 (목, 화, 토, 금, 수)
  → Zhipu AI에 사주 정보 + 건강 데이터 전달
  → 체질별 건강 인사이트 응답
  → InsightHistory에 저장 (type: SAJU)
```

### 사주 산출 로직
- 만세력 라이브러리 활용하여 천간(天干)/지지(地支) 계산
- 음력↔양력 변환 지원
- 서버 사이드에서 계산 후 AI 프롬프트에 포함

### AI 프롬프트 전략
사주 정보와 실제 건강 데이터를 결합하여 분석:
- **사주 단독 분석**: 오행 균형, 체질 유형, 취약 장기, 계절별 건강 주의점
- **사주 + 건강 데이터 결합 분석**: 실제 건강 기록과 사주 체질을 교차 분석하여 맞춤 조언
  - 예: "수(水) 기운이 약한 체질인데, 최근 혈압이 상승 추세입니다. 신장 건강에 주의하세요."

### InsightHistory 확장
| 필드 | 변경 |
|------|------|
| type | Enum: HEALTH, SAJU, CHECKUP, SUPPLEMENT_REC, SIDE_EFFECT, COMBINED |

- `HEALTH`: 건강 데이터 기반 분석
- `SAJU`: 사주 단독 분석
- `CHECKUP`: 건강검진 PDF 기반 분석
- `SUPPLEMENT_REC`: 건강 상태 기반 보조제 추천
- `SIDE_EFFECT`: 처방약 부작용 및 약물 상호작용 분석
- `RISK_ASSESSMENT`: 질환 위험도 예측
- `EXERCISE_RX`: 맞춤형 운동 처방
- `NUTRITION_ANALYSIS`: 영양 분석 및 식이 조언
- `CORRELATION`: 건강 데이터 상관관계 분석
- `SEASONAL`: 계절/환경 건강 알림
- `FAMILY_PATTERN`: 가족 건강 유전 패턴 분석
- `COMBINED`: 모든 데이터 종합 분석

## 8. 질환 위험도 예측 (Predictive Health Risk)

### 개요
축적된 건강 데이터, 검진 결과, 가족력, 생활습관을 종합 분석하여 주요 질환의 위험도를 AI가 평가하고 예방 전략을 제안.

### 분석 대상 질환군

| 영역 | 질환/위험 요인 | 주요 입력 데이터 |
|------|--------------|-----------------|
| 심혈관 | 고혈압, 동맥경화, 심근경색 위험 | 혈압 추세, 콜레스테롤, 체중, 운동량, 흡연 |
| 대사 | 당뇨, 대사증후군, 비만 | 혈당, BMI, 허리둘레, 중성지방, HDL |
| 간 | 지방간, 간 기능 저하 | AST/ALT/GGT, 음주량, 체중 변화 |
| 신장 | 만성 신장 질환 | 크레아티닌, GFR, 혈압, 당뇨 여부 |
| 근골격 | 골다공증 위험, 근감소증 | 나이, 성별, 체중, 운동량, 칼슘/비타민D 섭취 |
| 정신 | 우울증 위험, 번아웃 | 기분/스트레스/불안 추세, 수면 패턴 |

### 분석 흐름

```
위험도 분석 요청
  → 전체 HealthRecord + CheckupRecord + 복용약 수집
  → 나이, 성별, 생활습관 패턴 분석
  → Zhipu AI에 전달 (예방의학 전문가 시스템 프롬프트)
  → 질환별 위험도(낮음/보통/주의/높음) + 근거 + 예방 전략 반환
  → InsightHistory에 저장 (type: RISK_ASSESSMENT)
```

### 위험도 등급
| 등급 | 설명 | 색상 |
|------|------|------|
| LOW | 양호, 현재 생활습관 유지 | 녹색 |
| MODERATE | 관심 필요, 생활습관 개선 권장 | 노란색 |
| CAUTION | 주의 필요, 적극적 관리 권장 | 주황색 |
| HIGH | 의료 전문가 상담 권장 | 빨간색 |

## 9. 맞춤형 운동 처방 (Exercise Prescription)

### 개요
스포츠의학 관점에서 사용자의 건강 상태, 체력 수준, 목표에 맞는 운동 프로그램을 AI가 설계.

### HealthRecord 확장 — ACTIVITY data 추가 필드
```json
{
  "steps": 8500,
  "sleepHours": 7.5,
  "exercise": "달리기",
  "duration": 30,
  "intensity": "MODERATE",
  "heartRateAvg": 135,
  "heartRateMax": 165,
  "caloriesBurned": 320,
  "rpe": 6
}
```

| 필드 | 설명 |
|------|------|
| intensity | LOW / MODERATE / HIGH / VERY_HIGH |
| heartRateAvg | 운동 중 평균 심박수 (bpm) |
| heartRateMax | 운동 중 최고 심박수 (bpm) |
| caloriesBurned | 소모 칼로리 (kcal) |
| rpe | 운동자각도 (1~10, Borg RPE 간소화) |

### 운동 처방 분석

```
운동 처방 요청
  → 사용자 프로필 (나이, 성별, 체중) 수집
  → 최근 운동 기록 + 바이탈 사인 + 검진 결과 분석
  → 복용약 확인 (운동 제한 약물: 베타차단제, 혈당강하제 등)
  → Zhipu AI에 전달 (스포츠의학 전문가 시스템 프롬프트)
  → 주간 운동 프로그램 반환
  → InsightHistory에 저장 (type: EXERCISE_RX)
```

AI 분석 내용:
- **운동 능력 평가**: 현재 체력 수준, 최대 심박수 추정, 적정 운동 강도 구간
- **주간 프로그램 설계**: 유산소/근력/유연성 배분, 주당 빈도, 세트/반복 수
- **질환별 운동 주의사항**: 고혈압 환자의 등척성 운동 제한, 당뇨 환자의 저혈당 위험 등
- **약물-운동 상호작용**: 베타차단제 복용 시 심박수 기반 강도 조절 부적합 → RPE 기반 권장
- **점진적 과부하**: 운동 기록 추세 분석 후 강도/볼륨 점진적 증가 제안
- **회복 모니터링**: 수면 질, 안정 시 심박수, 컨디션 점수로 과훈련 징후 감지

## 10. 영양 분석 및 식단 관리 (Nutrition Analysis)

### 개요
식단 기록을 기반으로 영양 균형을 분석하고, 건강 상태와 목표에 맞는 식이 조언을 AI가 제공.

### 분석 흐름

```
영양 분석 요청
  → 최근 7일간 NUTRITION 기록 수집
  → 일일 평균 칼로리/영양소 계산
  → 건강 데이터 + 검진 결과 + 복용약 연동
  → Zhipu AI에 전달 (영양학 전문가 시스템 프롬프트)
  → 영양 분석 결과 반환
  → InsightHistory에 저장 (type: NUTRITION_ANALYSIS)
```

AI 분석 내용:
- **일일 영양 균형**: 탄수화물/단백질/지방 비율 평가 (권장: 50:30:20 또는 개인 목표별)
- **미량 영양소 점검**: 나트륨 과다, 식이섬유 부족, 수분 섭취량 등
- **질환별 식이 조언**:
  - 고혈압: 나트륨 제한 (2,000mg/일 이하), DASH 식단 권장
  - 당뇨: 혈당 지수(GI) 낮은 식품 추천, 탄수화물 분배
  - 지방간: 포화지방 제한, 항산화 식품 권장
  - 신장 질환: 단백질/칼륨/인 제한 식이
- **운동-영양 연계**: 운동량 대비 단백질 섭취 적정성 (1.2~2.0g/kg/일)
- **약물-식이 상호작용**: MAO 억제제 + 티라민 함유 식품 경고 등
- **사주 체질별 식이**: 오행 균형에 따른 음식 궁합 추천

## 11. 건강 목표 관리 (Health Goals)

### 데이터 모델

### HealthGoal
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| category | Enum | 목표 카테고리 |
| targetValue | Float | 목표 수치 |
| currentValue | Float? | 현재 수치 (자동 갱신) |
| unit | String | 단위 |
| startDate | DateTime | 시작일 |
| targetDate | DateTime? | 목표 달성일 |
| status | Enum (ACTIVE, ACHIEVED, ABANDONED) | 상태 |
| createdAt | DateTime | 생성일 |

#### category 값
| 값 | 예시 |
|------|------|
| WEIGHT_LOSS | 목표 체중 68kg 달성 |
| WEIGHT_GAIN | 목표 체중 75kg 달성 |
| BLOOD_PRESSURE | 수축기 혈압 120mmHg 이하 유지 |
| BLOOD_SUGAR | 공복 혈당 100mg/dL 이하 |
| EXERCISE_FREQ | 주 4회 이상 운동 |
| SLEEP | 평균 수면 7시간 이상 |
| STEPS | 일일 10,000걸음 |
| CUSTOM | 사용자 정의 목표 |

### AI 연동
- 목표 설정 시 AI가 현실적 달성 기간 제안
- 주간 진행 상황에 따라 격려/경고 메시지
- 목표 달성 전략 (식단, 운동, 생활습관) AI 코칭

## 12. 건강 타임라인 및 상관관계 분석

### 개요
모든 건강 데이터를 시간 축으로 통합하여 사건 간 상관관계를 AI가 발견.

### 타임라인 뷰
모든 기록 타입(바이탈, 운동, 식단, 복용약, 증상, 검진, 정신 건강)을 단일 타임라인에 표시하여 패턴 발견.

### AI 상관관계 분석

```
상관관계 분석 요청
  → 전체 HealthRecord를 시간순 정렬
  → 이벤트 간 시간적 근접성 분석
  → Zhipu AI에 전달 (데이터 분석 + 의학 시스템 프롬프트)
  → 발견된 패턴/상관관계 반환
  → InsightHistory에 저장 (type: CORRELATION)
```

AI가 탐지하는 패턴 예시:
- "운동한 날 수면 질이 평균 2점 높습니다"
- "나트륨 섭취가 2,500mg을 초과한 다음 날 혈압이 평균 8mmHg 상승합니다"
- "스트레스 수준이 7 이상인 날 두통 발생 확률이 3배 높습니다"
- "스타틴 복용 시작 후 근육통 증상이 주 2회 이상 기록되고 있습니다"
- "수면 6시간 미만인 날 다음 날 공복 혈당이 평균 15mg/dL 상승합니다"

## 13. 계절/환경 건강 알림 (Seasonal Health Advisory)

### 개요
현재 계절, 날씨, 사용자의 체질과 건강 상태를 결합하여 시의적절한 건강 조언을 제공.

### 분석 요소
- **계절**: 현재 날짜 기반 (봄/여름/가을/겨울)
- **사주 체질**: 계절별 취약점 (예: 금(金) 체질은 가을 호흡기 주의)
- **만성 질환**: 계절 영향을 받는 질환 관리 (겨울 고혈압, 여름 탈수)
- **복용약**: 계절별 약물 주의사항 (광과민성 약물 + 여름 자외선)

### 알림 시점
- 대시보드 접속 시 계절 건강 카드 자동 표시
- 계절 전환기(환절기)에 특별 주의사항 강조
- InsightHistory에 저장 (type: SEASONAL)

## 14. 가족 건강 유전 패턴 분석

### 개요
가족 구성원들의 건강 데이터를 교차 분석하여 가족 내 건강 패턴과 유전적 위험 요인을 파악.

### 분석 내용
- **가족 공통 패턴**: 가족 구성원 다수에게 나타나는 건강 지표 이상 (예: 가족 전체 콜레스테롤 높음)
- **세대 간 비교**: 부모-자녀 간 건강 지표 유사도 분석
- **예방적 조언**: 가족력 기반 자녀 세대 예방 관리 제안
  - 예: "부모 두 분 모두 고혈압 경향 → 자녀에게 조기 혈압 관리 및 나트륨 제한 식이 권장"
- InsightHistory에 저장 (type: FAMILY_PATTERN)

## 15. 페이지 구성


| 페이지 | 기능 |
|--------|------|
| `/login`, `/register` | 로그인, 회원가입 |
| `/family/join` | 초대 코드로 가족 합류 |
| `/dashboard` | 가족 전체 요약, 계절 건강 카드, 목표 진행률 |
| `/records/new` | 건강 데이터 입력 (타입 선택 → 항목 입력) |
| `/records` | 본인 건강 기록 목록/필터 |
| `/nutrition` | 식단 기록, 일일 영양 균형 차트, AI 식이 분석 |
| `/medications` | 복용약/건강보조제 관리, 부작용 분석, 보조제 추천 |
| `/symptoms` | 증상 기록, 증상-요인 상관관계 시각화 |
| `/mental` | 정신 건강 기록 (기분, 스트레스, 불안, 에너지, 수면 질) |
| `/checkup` | 건강검진 PDF 업로드, 연도별 비교, AI 분석 결과 |
| `/exercise` | 운동 기록, AI 운동 처방, 주간 프로그램 |
| `/goals` | 건강 목표 설정/추적, AI 코칭, 달성률 |
| `/risk` | 질환 위험도 대시보드, 위험 요인별 상세, 예방 전략 |
| `/timeline` | 전체 건강 타임라인, AI 상관관계 분석 |
| `/insight` | AI 종합 분석, 과거 인사이트 조회, 가족 패턴 |
| `/saju` | 사주 건강 분석 (체질, 계절 양생, 식이 궁합) |
| `/settings` | 프로필 수정, 가족 관리 (ADMIN) |

## 16. 에러 처리 및 보안

- Zhipu AI API 호출 실패 시: "분석을 일시적으로 수행할 수 없습니다" 메시지 반환
- API 키는 환경 변수(ZHIPU_API_KEY)로 관리
- 건강 데이터 접근: 같은 가족 구성원만 조회 가능 (API Route에서 familyId 검증)
- 입력 유효성: Zod 스키마로 API 입력 검증

## 17. 배포 구성

- Docker Compose: Next.js 앱 + 새 PostgreSQL 인스턴스 (포트 5435)
- 포트: 3200 (기존 서비스 3100, 5678, 8081, 8082, 8088과 충돌 없음)
- 환경 변수: .env로 DB URL, Zhipu API 키, NextAuth 시크릿 관리
- standalone 빌드로 Docker 이미지 최적화
