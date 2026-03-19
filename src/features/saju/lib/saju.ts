// 천간 (Heavenly Stems)
const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const

// 지지 (Earthly Branches)
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const

// 오행 매핑 (천간 → 오행)
const STEM_ELEMENTS: Record<string, string> = {
  '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
  '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
}

// 오행 매핑 (지지 → 오행)
const BRANCH_ELEMENTS: Record<string, string> = {
  '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화',
  '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수',
}

export interface SajuPillar {
  stem: string
  branch: string
}

export interface FiveElements {
  목: number
  화: number
  토: number
  금: number
  수: number
}

export interface SajuResult {
  yearPillar: SajuPillar
  monthPillar: SajuPillar
  dayPillar: SajuPillar
  hourPillar: SajuPillar
  fiveElements: FiveElements
}

/**
 * 사주팔자 산출 (간이 계산)
 * 실제 정밀한 만세력 계산은 AI 분석에서 보완합니다.
 */
export function calculateSaju(birthDate: Date, birthHour?: number): SajuResult {
  const year = birthDate.getFullYear()
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate()
  const hour = birthHour ?? 12

  // 년주 (Year Pillar) - 60갑자 순환 기반
  const yearStemIdx = (year - 4) % 10
  const yearBranchIdx = (year - 4) % 12

  // 월주 (Month Pillar) - 년간에 따른 월간 산출
  const monthStemIdx = ((yearStemIdx % 5) * 2 + month) % 10
  const monthBranchIdx = (month + 1) % 12

  // 일주 (Day Pillar) - 기본 일진 공식 (간이)
  const dayCount = Math.floor((year - 1900) * 365.25 + (month - 1) * 30.44 + day)
  const dayStemIdx = (dayCount + 9) % 10
  const dayBranchIdx = (dayCount + 1) % 12

  // 시주 (Hour Pillar) - 일간에 따른 시간 산출
  const hourBranchIdx = Math.floor((hour + 1) / 2) % 12
  const hourStemIdx = ((dayStemIdx % 5) * 2 + hourBranchIdx) % 10

  const pillars = {
    yearPillar: { stem: HEAVENLY_STEMS[yearStemIdx], branch: EARTHLY_BRANCHES[yearBranchIdx] },
    monthPillar: { stem: HEAVENLY_STEMS[monthStemIdx], branch: EARTHLY_BRANCHES[monthBranchIdx] },
    dayPillar: { stem: HEAVENLY_STEMS[dayStemIdx], branch: EARTHLY_BRANCHES[dayBranchIdx] },
    hourPillar: { stem: HEAVENLY_STEMS[hourStemIdx], branch: EARTHLY_BRANCHES[hourBranchIdx] },
  }

  // 오행 분포 계산
  const elements: FiveElements = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 }
  for (const pillar of Object.values(pillars)) {
    elements[STEM_ELEMENTS[pillar.stem] as keyof FiveElements]++
    elements[BRANCH_ELEMENTS[pillar.branch] as keyof FiveElements]++
  }

  return { ...pillars, fiveElements: elements }
}

/**
 * 사주 결과를 AI 프롬프트용 텍스트로 변환
 */
export function formatSajuForPrompt(saju: SajuResult): string {
  return `## 사주팔자
- 년주: ${saju.yearPillar.stem}${saju.yearPillar.branch}
- 월주: ${saju.monthPillar.stem}${saju.monthPillar.branch}
- 일주: ${saju.dayPillar.stem}${saju.dayPillar.branch}
- 시주: ${saju.hourPillar.stem}${saju.hourPillar.branch}

## 오행 분포
- 목(木): ${saju.fiveElements['목']}
- 화(火): ${saju.fiveElements['화']}
- 토(土): ${saju.fiveElements['토']}
- 금(金): ${saju.fiveElements['금']}
- 수(水): ${saju.fiveElements['수']}`
}
