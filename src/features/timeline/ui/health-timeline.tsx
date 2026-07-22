'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'

interface TimelineRecord {
  id: string
  type: string
  data: Record<string, unknown>
  recordedAt: string
  user?: { id: string; name: string | null }
}

const typeLabels: Record<string, string> = {
  BODY_MEASURE: '신체 측정',
  VITAL_SIGN: '활력 징후',
  ACTIVITY: '활동',
  MEDICATION: '복약',
  NUTRITION: '영양',
  SYMPTOM: '증상',
  MENTAL: '정신 건강',
}

const typeBadgeColors: Record<string, string> = {
  BODY_MEASURE: 'bg-blue-100 text-blue-800',
  VITAL_SIGN: 'bg-red-100 text-red-800',
  ACTIVITY: 'bg-green-100 text-green-800',
  MEDICATION: 'bg-purple-100 text-purple-800',
  NUTRITION: 'bg-orange-100 text-orange-800',
  SYMPTOM: 'bg-yellow-100 text-yellow-800',
  MENTAL: 'bg-pink-100 text-pink-800',
}

function summarizeData(type: string, data: Record<string, unknown>): string {
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
      break
    case 'ACTIVITY':
      if (data.exercise) parts.push(String(data.exercise))
      if (data.steps) parts.push(`${data.steps}걸음`)
      if (data.duration) parts.push(`${data.duration}분`)
      break
    case 'MEDICATION':
      if (data.name) parts.push(String(data.name))
      if (data.dosage) parts.push(String(data.dosage))
      break
    case 'NUTRITION':
      if (data.meal) {
        const mealLabels: Record<string, string> = { BREAKFAST: '아침', LUNCH: '점심', DINNER: '저녁', SNACK: '간식' }
        parts.push(mealLabels[String(data.meal)] ?? String(data.meal))
      }
      if (data.calories) parts.push(`${data.calories}kcal`)
      if (data.description) parts.push(String(data.description).slice(0, 30))
      break
    case 'SYMPTOM':
      if (data.symptom) parts.push(String(data.symptom))
      if (data.severity) parts.push(`심각도 ${data.severity}/10`)
      break
    case 'MENTAL':
      if (data.mood) parts.push(`기분 ${data.mood}/10`)
      if (data.stressLevel) parts.push(`스트레스 ${data.stressLevel}/10`)
      break
  }
  return parts.length > 0 ? parts.join(' · ') : JSON.stringify(data).slice(0, 60)
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateKey(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

function groupByDate(records: TimelineRecord[]): Record<string, TimelineRecord[]> {
  const groups: Record<string, TimelineRecord[]> = {}
  for (const record of records) {
    const dateKey = new Date(record.recordedAt).toISOString().slice(0, 10)
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(record)
  }
  return groups
}

export function HealthTimeline() {
  const [records, setRecords] = useState<TimelineRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [correlationLoading, setCorrelationLoading] = useState(false)
  const [correlationResult, setCorrelationResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/health?limit=200')
      if (!res.ok) throw new Error()
      const body = await res.json()
      setRecords(body.records || [])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const requestCorrelation = async () => {
    setCorrelationLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'CORRELATION' }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? '분석 요청 중 오류가 발생했습니다.')
        return
      }

      const body = await res.json()
      setCorrelationResult(body.insight.response)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setCorrelationLoading(false)
    }
  }

  const grouped = groupByDate(records)
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      {/* 상관관계 분석 요청 */}
      <Card>
        <CardHeader>
          <CardTitle>상관관계 분석</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            건강 기록 간의 시간적 패턴과 상관관계를 AI가 분석합니다.
          </p>
          <Button onClick={requestCorrelation} disabled={correlationLoading} className="w-full">
            {correlationLoading ? '분석 중...' : '상관관계 분석 요청'}
          </Button>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상관관계 결과 */}
      {correlationResult && (
        <Card>
          <CardHeader>
            <CardTitle>상관관계 분석 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-foreground/90">
              {correlationResult}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 타임라인 */}
      <h3 className="text-lg font-semibold">건강 기록 타임라인</h3>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : dateKeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">건강 기록이 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              {/* 날짜 헤더 */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  {formatDateKey(grouped[dateKey][0].recordedAt)}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {grouped[dateKey].length}건
                </Badge>
              </div>

              {/* 해당 날짜의 기록들 */}
              <div className="ml-1.5 border-l-2 border-muted pl-6 space-y-2">
                {grouped[dateKey].map((record) => (
                  <div
                    key={record.id}
                    className="relative flex items-start gap-3 rounded-lg border bg-card p-3"
                  >
                    <div className="absolute -left-[29px] top-4 h-2.5 w-2.5 rounded-full border-2 border-muted bg-background" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={typeBadgeColors[record.type] || ''}>
                          {typeLabels[record.type] || record.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(record.recordedAt)}
                        </span>
                        {record.user?.name && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {record.user.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80">
                        {summarizeData(record.type, record.data)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
