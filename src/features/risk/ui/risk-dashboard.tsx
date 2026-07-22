'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'

interface RiskInsight {
  id: string
  response: string
  createdAt: string
}

const riskLevelColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800 border-green-200',
  MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CAUTION: 'bg-orange-100 text-orange-800 border-orange-200',
  HIGH: 'bg-red-100 text-red-800 border-red-200',
}

const riskLevelLabels: Record<string, string> = {
  LOW: '낮음',
  MODERATE: '보통',
  CAUTION: '주의',
  HIGH: '높음',
}

// 응답 텍스트에서 위험도 레벨 추출
function extractRiskLevels(response: string): { category: string; level: string }[] {
  const categories = ['심혈관계', '대사질환', '간 건강', '신장 건강', '근골격계', '정신 건강']
  const levels: { category: string; level: string }[] = []

  for (const category of categories) {
    // "위험도**: LOW" 또는 "위험도: LOW" 패턴 매칭
    const regex = new RegExp(`${category}[\\s\\S]*?위험도[*]*:\\s*(LOW|MODERATE|CAUTION|HIGH)`, 'i')
    const match = response.match(regex)
    if (match) {
      levels.push({ category, level: match[1].toUpperCase() })
    }
  }

  return levels
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RiskDashboard() {
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [insight, setInsight] = useState<RiskInsight | null>(null)
  const [riskLevels, setRiskLevels] = useState<{ category: string; level: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchLatest = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/insight?type=RISK_ASSESSMENT&limit=1')
      if (!res.ok) throw new Error()
      const body = await res.json()
      if (body.insights?.length > 0) {
        const latest = body.insights[0]
        setInsight(latest)
        setRiskLevels(extractRiskLevels(latest.response))
      }
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLatest()
  }, [fetchLatest])

  const requestAnalysis = async () => {
    setRequesting(true)
    setError(null)
    try {
      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'RISK_ASSESSMENT' }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? '분석 요청 중 오류가 발생했습니다.')
        return
      }

      const body = await res.json()
      setInsight(body.insight)
      setRiskLevels(extractRiskLevels(body.insight.response))
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 분석 요청 영역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>질환 위험도 분석</span>
            {insight && (
              <span className="text-xs text-muted-foreground font-normal">
                마지막 분석: {formatDate(insight.createdAt)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            건강 기록을 기반으로 주요 질환 카테고리별 위험도를 AI가 평가합니다.
          </p>
          <Button onClick={requestAnalysis} disabled={requesting || loading} className="w-full">
            {requesting ? '분석 중...' : '위험도 분석 요청'}
          </Button>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 위험도 요약 카드 */}
      {riskLevels.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {riskLevels.map(({ category, level }) => (
            <Card key={category} size="sm">
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2">{category}</p>
                <Badge className={riskLevelColors[level] || ''}>
                  {riskLevelLabels[level] || level}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 상세 분석 결과 */}
      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : insight ? (
        <Card>
          <CardHeader>
            <CardTitle>상세 분석 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-foreground/90">
              {insight.response}
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          아직 위험도 분석 기록이 없습니다. 위 버튼을 눌러 분석을 시작하세요.
        </p>
      )}
    </div>
  )
}
