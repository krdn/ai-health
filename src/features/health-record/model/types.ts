export type { HealthRecordType } from './validation'

// 기록 타입별 한국어 라벨
export const healthRecordTypeLabels: Record<string, string> = {
  BODY_MEASURE: '신체 측정',
  VITAL_SIGN: '활력 징후',
  ACTIVITY: '활동',
  MEDICATION: '복약',
  NUTRITION: '영양',
  SYMPTOM: '증상',
  MENTAL: '정신 건강',
}

// 데이터 요약 텍스트
export function summarizeData(type: string, data: Record<string, unknown>): string {
  const parts: string[] = []
  switch (type) {
    case 'BODY_MEASURE':
      if (data.weight) parts.push(`${data.weight}kg`)
      if (data.height) parts.push(`${data.height}cm`)
      break
    case 'VITAL_SIGN':
      if (data.systolic && data.diastolic) parts.push(`혈압 ${data.systolic}/${data.diastolic}`)
      if (data.heartRate) parts.push(`심박 ${data.heartRate}bpm`)
      break
    case 'ACTIVITY':
      if (data.exercise) parts.push(String(data.exercise))
      if (data.steps) parts.push(`${data.steps}걸음`)
      break
    case 'MEDICATION':
      if (data.name) parts.push(String(data.name))
      break
    case 'NUTRITION':
      if (data.meal) {
        const ml: Record<string, string> = { BREAKFAST: '아침', LUNCH: '점심', DINNER: '저녁', SNACK: '간식' }
        parts.push(ml[String(data.meal)] ?? String(data.meal))
      }
      if (data.calories) parts.push(`${data.calories}kcal`)
      break
    case 'SYMPTOM':
      if (data.symptom) parts.push(String(data.symptom))
      break
    case 'MENTAL':
      if (data.mood) parts.push(`기분 ${data.mood}/10`)
      break
  }
  return parts.join(' · ') || '기록'
}
