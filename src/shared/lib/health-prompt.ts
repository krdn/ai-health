import type { HealthRecord } from '@/generated/prisma/client'

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
