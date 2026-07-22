'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

interface SajuPillar {
  stem: string
  branch: string
}

interface FiveElements {
  목: number
  화: number
  토: number
  금: number
  수: number
}

interface SajuData {
  yearPillar: SajuPillar
  monthPillar: SajuPillar
  dayPillar: SajuPillar
  hourPillar: SajuPillar
  fiveElements: FiveElements
}

const elementColors: Record<string, string> = {
  '목': 'bg-green-500',
  '화': 'bg-red-500',
  '토': 'bg-yellow-500',
  '금': 'bg-gray-400',
  '수': 'bg-blue-500',
}

const elementLabels: Record<string, string> = {
  '목': '목(木)',
  '화': '화(火)',
  '토': '토(土)',
  '금': '금(金)',
  '수': '수(水)',
}

export function SajuAnalysis() {
  const [saju, setSaju] = useState<SajuData | null>(null)
  const [noBirthDate, setNoBirthDate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 사주 데이터 로드
  useEffect(() => {
    fetch('/api/saju')
      .then(async (res) => {
        if (res.status === 400) {
          setNoBirthDate(true)
          return
        }
        if (!res.ok) throw new Error('사주 조회 실패')
        const data = await res.json()
        setSaju(data.saju)
      })
      .catch(() => setError('사주 데이터를 불러오는 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const handleAnalysis = async (includeHealth: boolean) => {
    setAnalyzing(true)
    setResponse(null)
    setError(null)

    try {
      const res = await fetch('/api/saju', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeHealth }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        if (res.status === 429) {
          setError(body?.error ?? '일일 분석 횟수를 초과했습니다.')
        } else if (res.status === 503) {
          setError(body?.error ?? 'AI 서비스가 일시적으로 이용 불가합니다.')
        } else {
          setError(body?.error ?? '분석 요청 중 오류가 발생했습니다.')
        }
        return
      }

      const body = await res.json()
      setResponse(body.insight.response)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500">로딩 중...</p>
  }

  // 생년월일 미설정
  if (noBirthDate) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <p className="text-gray-600">
            사주 분석을 위해 프로필에서 생년월일시를 설정해주세요.
          </p>
          <Link href="/settings">
            <Button variant="outline">설정으로 이동</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const maxElement = saju ? Math.max(...Object.values(saju.fiveElements), 1) : 1

  return (
    <div className="space-y-6">
      {/* 사주팔자 표시 */}
      {saju && (
        <Card>
          <CardHeader>
            <CardTitle>사주팔자 (四柱八字)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 사주 표 */}
            <div className="grid grid-cols-4 gap-4 text-center mb-8">
              {[
                { label: '시주', pillar: saju.hourPillar },
                { label: '일주', pillar: saju.dayPillar },
                { label: '월주', pillar: saju.monthPillar },
                { label: '년주', pillar: saju.yearPillar },
              ].map(({ label, pillar }) => (
                <div key={label} className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-2xl font-bold">{pillar.stem}</p>
                    <p className="text-lg text-gray-600">{pillar.branch}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 오행 분포 차트 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">오행 분포</p>
              <div className="space-y-2">
                {(Object.keys(saju.fiveElements) as Array<keyof FiveElements>).map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm w-14 text-right">{elementLabels[key]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${elementColors[key]} transition-all`}
                        style={{ width: `${(saju.fiveElements[key] / maxElement) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm w-6 text-gray-500">{saju.fiveElements[key]}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 분석 버튼 */}
      <Card>
        <CardHeader>
          <CardTitle>AI 사주 건강 분석</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => handleAnalysis(false)}
              disabled={analyzing}
              variant="outline"
            >
              {analyzing ? '분석 중...' : '사주 건강 분석'}
            </Button>
            <Button
              onClick={() => handleAnalysis(true)}
              disabled={analyzing}
            >
              {analyzing ? '분석 중...' : '사주 + 건강 데이터 종합 분석'}
            </Button>
          </div>

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
    </div>
  )
}
