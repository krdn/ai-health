'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { SupplementDetailModal } from './supplement-detail-modal'
import type { FamilySupplementItem, Ingredient } from '../model/types'

const categoryLabels: Record<string, string> = {
  PRESCRIPTION: '처방약',
  OTC: '일반의약품',
  SUPPLEMENT: '보조제',
  HERB: '한약',
}

const categoryColors: Record<string, string> = {
  PRESCRIPTION: 'bg-blue-100 text-blue-800',
  OTC: 'bg-green-100 text-green-800',
  SUPPLEMENT: 'bg-purple-100 text-purple-800',
  HERB: 'bg-amber-100 text-amber-800',
}

const suitabilityStyles: Record<string, { label: string; color: string }> = {
  RECOMMENDED: { label: '권장', color: 'bg-green-100 text-green-800' },
  NEUTRAL: { label: '보통', color: 'bg-gray-100 text-gray-800' },
  CAUTION: { label: '주의', color: 'bg-yellow-100 text-yellow-800' },
  AVOID: { label: '금지', color: 'bg-red-100 text-red-800' },
}

export function SupplementCatalogList({ refreshKey }: { refreshKey?: number }) {
  const [supplements, setSupplements] = useState<FamilySupplementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchSupplements = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/supplements')
      if (!res.ok) throw new Error('조회 실패')
      const body = await res.json()
      setSupplements(body.supplements)
    } catch {
      setSupplements([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSupplements()
  }, [fetchSupplements, refreshKey])

  const handleDelete = async (id: string) => {
    if (!confirm('이 약품을 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/supplements/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        alert(body.error || '삭제에 실패했습니다')
        return
      }
      fetchSupplements()
    } catch {
      alert('삭제 중 오류가 발생했습니다')
    }
  }

  const handleAnalyze = async (id: string) => {
    try {
      const res = await fetch('/api/supplements/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplementId: id, analysisType: 'INGREDIENTS' }),
      })
      if (!res.ok) {
        const body = await res.json()
        alert(body.error || '분석에 실패했습니다')
        return
      }
      fetchSupplements()
    } catch {
      alert('분석 중 오류가 발생했습니다')
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  if (supplements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        등록된 약품이 없습니다. 위 폼에서 약품을 추가해 주세요.
      </p>
    )
  }

  const selected = supplements.find((s) => s.id === selectedId) || null

  return (
    <>
      <div className="space-y-3">
        {supplements.map((item) => (
          <SupplementCard
            key={item.id}
            item={item}
            onDelete={handleDelete}
            onAnalyze={handleAnalyze}
            onDetail={() => setSelectedId(item.id)}
          />
        ))}
      </div>

      {selected && (
        <SupplementDetailModal
          supplement={selected}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          onRefresh={fetchSupplements}
        />
      )}
    </>
  )
}

function SupplementCard({
  item,
  onDelete,
  onAnalyze,
  onDetail,
}: {
  item: FamilySupplementItem
  onDelete: (id: string) => void
  onAnalyze: (id: string) => void
  onDetail: () => void
}) {
  const ingredients = item.ingredients as Ingredient[] | null
  const hasIngredients = ingredients && ingredients.length > 0
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setAnalyzing(true)
    await onAnalyze(item.id)
    setAnalyzing(false)
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onDetail}>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{item.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[item.category] || ''}`}>
              {categoryLabels[item.category] || item.category}
            </span>
            {!hasIngredients && !item.aiAnalyzedAt && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                성분 분석 대기
              </span>
            )}
            {item.aiAnalyzedAt && hasIngredients && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                성분 분석 완료
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {item.dosage && <span>용량: {item.dosage}</span>}
            {item.frequency && <span>빈도: {item.frequency}</span>}
          </div>

          {hasIngredients && (
            <div className="flex flex-wrap gap-1">
              {ingredients.slice(0, 5).map((ing, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                  {ing.name}
                </span>
              ))}
              {ingredients.length > 5 && (
                <span className="text-xs text-muted-foreground">+{ingredients.length - 5}개</span>
              )}
            </div>
          )}

          {item.notes && (
            <p className="text-sm text-muted-foreground truncate">{item.notes}</p>
          )}

          <p className="text-xs text-muted-foreground">등록: {item.creator.name}</p>
        </div>

        <div className="flex flex-col gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {!hasIngredients && (
            <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? '분석 중...' : '성분 분석'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            삭제
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { suitabilityStyles }
