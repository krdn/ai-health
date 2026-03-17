import type { HealthRecord } from '@/generated/prisma/client'

export const HEALTH_SYSTEM_PROMPT = `당신은 가정 건강 관리 전문 AI 분석가입니다.
사용자의 건강 기록 데이터를 분석하여 종합적인 건강 인사이트를 제공합니다.

응답 형식:
1. **종합 건강 요약**: 전반적인 건강 상태 평가
2. **주요 발견 사항**: 데이터에서 발견된 패턴이나 주목할 점
3. **위험 요인 분석**: 주의가 필요한 수치나 추세 (위험도: 낮음/중간/높음 표시)
4. **개선 권장 사항**: 구체적이고 실행 가능한 건강 개선 제안
5. **추적 권장 항목**: 앞으로 모니터링하면 좋을 건강 지표

규칙:
- 한국어로 응답하세요
- 각 분석에 근거/이유를 포함하세요
- 수치 데이터는 정상 범위와 비교하여 설명하세요
- 위험 수준이 높은 항목은 명확하게 경고하세요
- 의학적 진단은 하지 마세요. 관찰 및 권장 수준으로 제공하세요`

// 건강 기록 타입별 한국어 라벨
const typeLabels: Record<string, string> = {
  BODY_MEASURE: '신체 측정',
  VITAL_SIGN: '활력 징후',
  ACTIVITY: '활동',
  MEDICATION: '복약',
  NUTRITION: '영양',
  SYMPTOM: '증상',
  MENTAL: '정신 건강',
}

// 건강 기록 데이터를 AI 프롬프트용 텍스트로 변환
export function buildHealthAnalysisPrompt(
  records: HealthRecord[],
  userName: string
): string {
  if (records.length === 0) {
    return `${userName}님의 건강 기록이 없습니다. 분석할 데이터가 부족합니다.`
  }

  const grouped: Record<string, { recordedAt: Date; data: unknown }[]> = {}
  for (const record of records) {
    const label = typeLabels[record.type] || record.type
    if (!grouped[label]) grouped[label] = []
    grouped[label].push({
      recordedAt: record.recordedAt,
      data: record.data,
    })
  }

  let prompt = `## ${userName}님의 건강 기록 (총 ${records.length}건)\n\n`

  for (const [type, items] of Object.entries(grouped)) {
    prompt += `### ${type} (${items.length}건)\n`
    for (const item of items) {
      const date = new Date(item.recordedAt).toLocaleDateString('ko-KR')
      prompt += `- [${date}] ${JSON.stringify(item.data)}\n`
    }
    prompt += '\n'
  }

  prompt += '위 건강 기록 데이터를 종합적으로 분석해주세요.'
  return prompt
}
