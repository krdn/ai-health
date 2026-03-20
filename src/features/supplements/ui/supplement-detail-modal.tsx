'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { suitabilityStyles } from './supplement-catalog-list'
import type {
  FamilySupplementItem,
  Ingredient,
  SupplementWarnings,
  MemberSuitabilityResult,
} from '../model/types'

interface Props {
  supplement: FamilySupplementItem
  open: boolean
  onClose: () => void
  onRefresh: () => void
}

export function SupplementDetailModal({ supplement, open, onClose, onRefresh }: Props) {
  const [analyzing, setAnalyzing] = useState(false)
  const [suitabilityResults, setSuitabilityResults] = useState<MemberSuitabilityResult[] | null>(null)
  const [overallNotes, setOverallNotes] = useState<string | null>(null)
  const [rawResult, setRawResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const ingredients = supplement.ingredients as Ingredient[] | null
  const warnings = supplement.warnings as SupplementWarnings | null

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (open) {
      setSuitabilityResults(null)
      setOverallNotes(null)
      setRawResult(null)
      setError(null)
    }
  }, [open, supplement.id])

  if (!open) return null

  const handleSuitabilityAnalysis = async () => {
    setAnalyzing(true)
    setError(null)
    setSuitabilityResults(null)
    setRawResult(null)

    try {
      if (!ingredients || ingredients.length === 0) {
        const analyzeRes = await fetch('/api/supplements/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplementId: supplement.id, analysisType: 'INGREDIENTS' }),
        })
        if (!analyzeRes.ok) {
          setError('성분 분석에 실패했습니다. 다시 시도해 주세요.')
          return
        }
        onRefresh()
      }

      const res = await fetch('/api/supplements/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplementId: supplement.id, analysisType: 'MEMBER_SUITABILITY' }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || '분석에 실패했습니다')
        return
      }

      const body = await res.json()

      if (body.results) {
        setSuitabilityResults(body.results)
        setOverallNotes(body.overallNotes || null)
      } else if (body.raw) {
        setRawResult(body.raw)
      }
    } catch {
      setError('분석 중 오류가 발생했습니다')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 모달 컨텐츠 */}
      <Card className="relative z-10 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{supplement.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 정보 */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">기본 정보</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {supplement.dosage && (
                <div><span className="text-muted-foreground">용량:</span> {supplement.dosage}</div>
              )}
              {supplement.frequency && (
                <div><span className="text-muted-foreground">복용 빈도:</span> {supplement.frequency}</div>
              )}
              <div><span className="text-muted-foreground">등록자:</span> {supplement.creator.name}</div>
              <div>
                <span className="text-muted-foreground">등록일:</span>{' '}
                {new Date(supplement.createdAt).toLocaleDateString('ko-KR')}
              </div>
            </div>
            {supplement.notes && (
              <p className="text-sm text-muted-foreground">{supplement.notes}</p>
            )}
          </section>

          {/* 성분 정보 */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">성분 정보</h4>
            {ingredients && ingredients.length > 0 ? (
              <div className="space-y-1">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-gray-50">
                    <span className="font-medium min-w-[80px]">{ing.name}</span>
                    {ing.amount && ing.unit && (
                      <span className="text-muted-foreground">{ing.amount}{ing.unit}</span>
                    )}
                    {ing.role && (
                      <span className="text-muted-foreground">- {ing.role}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {supplement.aiAnalyzedAt ? '성분 정보를 파싱할 수 없습니다.' : '아직 분석되지 않았습니다.'}
              </p>
            )}
          </section>

          {/* 주의사항 */}
          {warnings && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">주의사항</h4>
              {warnings.interactions?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-orange-700">약물 상호작용</p>
                  <ul className="text-sm space-y-0.5 list-disc list-inside text-muted-foreground">
                    {warnings.interactions.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
              {warnings.contraindications?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-red-700">복용 금기</p>
                  <ul className="text-sm space-y-0.5 list-disc list-inside text-muted-foreground">
                    {warnings.contraindications.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
              {warnings.sideEffects?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-yellow-700">알려진 부작용</p>
                  <ul className="text-sm space-y-0.5 list-disc list-inside text-muted-foreground">
                    {warnings.sideEffects.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* 구성원별 적합성 분석 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground">구성원별 적합성</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSuitabilityAnalysis}
                disabled={analyzing}
              >
                {analyzing ? '분석 중...' : suitabilityResults ? '재분석' : '분석 실행'}
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {suitabilityResults && (
              <div className="space-y-2">
                {suitabilityResults.map((result, i) => {
                  const style = suitabilityStyles[result.suitability] || suitabilityStyles.NEUTRAL
                  return (
                    <div key={i} className="p-3 rounded-lg border space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{result.memberName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${style.color}`}>
                          {style.label}
                        </span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-0.5">
                        {result.reasons.map((reason, j) => (
                          <li key={j}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
                {overallNotes && (
                  <p className="text-sm text-muted-foreground p-2 bg-blue-50 rounded">
                    {overallNotes}
                  </p>
                )}
              </div>
            )}

            {rawResult && (
              <div className="text-sm whitespace-pre-wrap p-3 bg-gray-50 rounded border">
                {rawResult}
              </div>
            )}

            {!suitabilityResults && !rawResult && !error && (
              <p className="text-xs text-muted-foreground">
                &quot;분석 실행&quot; 버튼을 눌러 가족 구성원별 적합성을 확인하세요.
                (일일 AI 분석 횟수에 포함됩니다)
              </p>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
