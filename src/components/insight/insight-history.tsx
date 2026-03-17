'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type InsightType = 'HEALTH' | 'SUPPLEMENT_REC' | 'SIDE_EFFECT'

const insightTypeLabels: Record<InsightType, string> = {
  HEALTH: '건강 분석',
  SUPPLEMENT_REC: '보조제 추천',
  SIDE_EFFECT: '부작용 분석',
}

const insightTypeKeys = Object.keys(insightTypeLabels) as InsightType[]

interface Insight {
  id: string
  type: InsightType
  response: string
  createdAt: string
  user?: { id: string; name: string | null }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
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

// 미리보기 텍스트 생성 (면책 조항 제외, 100자 제한)
function previewText(text: string): string {
  const cleaned = text.split('\n---\n')[0].trim()
  if (cleaned.length <= 100) return cleaned
  return cleaned.slice(0, 100) + '...'
}

export function InsightHistory() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 10, total: 0, totalPages: 0,
  })
  const [typeFilter, setTypeFilter] = useState<InsightType | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchInsights = useCallback(async (page: number, type: InsightType | null) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (type) params.set('type', type)

      const res = await fetch(`/api/insight?${params}`)
      if (!res.ok) throw new Error('조회 실패')

      const body = await res.json()
      setInsights(body.insights)
      setPagination(body.pagination)
    } catch {
      setInsights([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInsights(1, typeFilter)
  }, [typeFilter, fetchInsights])

  const handleFilterChange = (type: InsightType | null) => {
    setTypeFilter(type)
    setExpandedId(null)
  }

  const handlePage = (page: number) => {
    fetchInsights(page, typeFilter)
    setExpandedId(null)
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>분석 이력</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 타입 필터 */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={typeFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(null)}
          >
            전체
          </Button>
          {insightTypeKeys.map((key) => (
            <Button
              key={key}
              variant={typeFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(key)}
            >
              {insightTypeLabels[key]}
            </Button>
          ))}
        </div>

        {/* 이력 목록 */}
        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">분석 이력이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                onClick={() => toggleExpand(insight.id)}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{insightTypeLabels[insight.type]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(insight.createdAt)}
                  </span>
                  {insight.user?.name && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {insight.user.name}
                    </span>
                  )}
                </div>
                {expandedId === insight.id ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                    {insight.response}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {previewText(insight.response)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePage(pagination.page - 1)}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePage(pagination.page + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
