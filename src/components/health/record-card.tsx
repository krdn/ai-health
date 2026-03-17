'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { healthRecordTypeLabels, type HealthRecordType } from '@/lib/validations/health-record'

interface HealthRecord {
  id: string
  type: HealthRecordType
  data: Record<string, unknown>
  recordedAt: string
  user?: { id: string; name: string | null }
}

// 데이터 요약 텍스트 생성
function summarizeData(type: HealthRecordType, data: Record<string, unknown>): string {
  const parts: string[] = []

  switch (type) {
    case 'BODY_MEASURE':
      if (data.weight) parts.push(`${data.weight}kg`)
      if (data.height) parts.push(`${data.height}cm`)
      if (data.bodyFat) parts.push(`체지방 ${data.bodyFat}%`)
      break
    case 'VITAL_SIGN':
      if (data.systolic && data.diastolic) parts.push(`혈압 ${data.systolic}/${data.diastolic}`)
      if (data.heartRate) parts.push(`심박 ${data.heartRate}bpm`)
      if (data.bloodSugar) parts.push(`혈당 ${data.bloodSugar}`)
      if (data.temperature) parts.push(`${data.temperature}°C`)
      break
    case 'ACTIVITY':
      if (data.exercise) parts.push(String(data.exercise))
      if (data.steps) parts.push(`${data.steps}걸음`)
      if (data.duration) parts.push(`${data.duration}분`)
      if (data.caloriesBurned) parts.push(`${data.caloriesBurned}kcal`)
      break
    case 'MEDICATION':
      if (data.name) parts.push(String(data.name))
      if (data.dosage) parts.push(String(data.dosage))
      if (data.frequency) parts.push(String(data.frequency))
      break
    case 'NUTRITION':
      if (data.meal) {
        const mealLabels: Record<string, string> = {
          BREAKFAST: '아침', LUNCH: '점심', DINNER: '저녁', SNACK: '간식',
        }
        parts.push(mealLabels[String(data.meal)] ?? String(data.meal))
      }
      if (data.calories) parts.push(`${data.calories}kcal`)
      if (data.description) parts.push(String(data.description).slice(0, 30))
      break
    case 'SYMPTOM':
      if (data.symptom) parts.push(String(data.symptom))
      if (data.severity) parts.push(`심각도 ${data.severity}/10`)
      if (data.location) parts.push(String(data.location))
      break
    case 'MENTAL':
      if (data.mood) parts.push(`기분 ${data.mood}/10`)
      if (data.stressLevel) parts.push(`스트레스 ${data.stressLevel}/10`)
      if (data.energyLevel) parts.push(`에너지 ${data.energyLevel}/10`)
      break
  }

  return parts.length > 0 ? parts.join(' · ') : '데이터 없음'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecordCard({ record }: { record: HealthRecord }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="secondary">{healthRecordTypeLabels[record.type]}</Badge>
          <span className="text-xs text-muted-foreground font-normal">
            {formatDate(record.recordedAt)}
          </span>
          {record.user?.name && (
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {record.user.name}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80">
          {summarizeData(record.type, record.data)}
        </p>
      </CardContent>
    </Card>
  )
}
