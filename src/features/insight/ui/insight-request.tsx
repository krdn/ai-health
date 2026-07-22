'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

type InsightType =
  | 'HEALTH'
  | 'SUPPLEMENT_REC'
  | 'SIDE_EFFECT'
  | 'RISK_ASSESSMENT'
  | 'EXERCISE_RX'
  | 'NUTRITION_ANALYSIS'
  | 'CORRELATION'
  | 'SEASONAL'
  | 'FAMILY_PATTERN'
  | 'COMBINED'

const insightTypeLabels: Record<InsightType, string> = {
  HEALTH: '건강 분석',
  SUPPLEMENT_REC: '보조제 추천',
  SIDE_EFFECT: '부작용 분석',
  RISK_ASSESSMENT: '질환 위험도 예측',
  EXERCISE_RX: '맞춤형 운동 처방',
  NUTRITION_ANALYSIS: '영양 분석',
  CORRELATION: '상관관계 분석',
  SEASONAL: '계절 건강 알림',
  FAMILY_PATTERN: '가족 건강 패턴',
  COMBINED: '종합 분석',
}

const insightTypeDescriptions: Record<InsightType, string> = {
  HEALTH: '전반적인 건강 상태를 종합 분석합니다.',
  SUPPLEMENT_REC: '건강 데이터 기반 맞춤형 보충제를 추천합니다.',
  SIDE_EFFECT: '복약 기록과 증상의 연관성을 분석합니다.',
  RISK_ASSESSMENT: '주요 질환 카테고리별 위험도를 평가합니다.',
  EXERCISE_RX: '건강 상태에 맞는 주간 운동 프로그램을 설계합니다.',
  NUTRITION_ANALYSIS: '식단의 영양 균형과 약물-음식 상호작용을 분석합니다.',
  CORRELATION: '건강 기록 간의 시간적 패턴과 상관관계를 찾습니다.',
  SEASONAL: '현재 계절에 맞는 건강 관리 방안을 제안합니다.',
  FAMILY_PATTERN: '가족 구성원 간의 건강 패턴을 비교 분석합니다.',
  COMBINED: '위험도, 영양, 운동, 계절, 상관관계를 종합 분석합니다.',
}

const insightTypeKeys = Object.keys(insightTypeLabels) as InsightType[]

// 기본 날짜 범위: 최근 30일
function defaultFromDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function InsightRequest() {
  const [type, setType] = useState<InsightType>('HEALTH')
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(todayDate)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setResponse(null)
    setError(null)

    try {
      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, fromDate, toDate }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        if (res.status === 429) {
          setError(body?.error ?? '일일 분석 횟수를 초과했습니다. 내일 다시 시도해주세요.')
        } else if (res.status === 503) {
          setError(body?.error ?? 'AI 서비스가 일시적으로 이용 불가합니다. 잠시 후 다시 시도해주세요.')
        } else if (res.status === 401) {
          setError('로그인이 필요합니다.')
        } else {
          setError(body?.error ?? '분석 요청 중 오류가 발생했습니다.')
        }
        return
      }

      const body = await res.json()
      setResponse(body.insight.response)
    } catch {
      setError('네트워크 오류가 발생했습니다. 연결 상태를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI 분석 요청</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 분석 타입 선택 */}
        <div className="space-y-1.5">
          <Label htmlFor="insight-type">분석 유형</Label>
          <select
            id="insight-type"
            value={type}
            onChange={(e) => setType(e.target.value as InsightType)}
            disabled={loading}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {insightTypeKeys.map((key) => (
              <option key={key} value={key}>
                {insightTypeLabels[key]}
              </option>
            ))}
          </select>
        </div>

        {/* 선택된 타입 설명 */}
        <p className="text-xs text-muted-foreground">
          {insightTypeDescriptions[type]}
        </p>

        {/* 날짜 범위 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="from-date">시작일</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to-date">종료일</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* 분석 요청 버튼 */}
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? '분석 중...' : '분석 요청'}
        </Button>

        {/* 에러 표시 */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 응답 표시 */}
        {response && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{response}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
