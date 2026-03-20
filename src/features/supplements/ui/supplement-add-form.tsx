'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const val = (v: unknown) => (v != null ? String(v) : '')

interface SearchResult {
  name: string
  category: string
  manufacturer?: string
  ingredients?: string
  usage?: string
  warnings?: string
  source: 'local' | 'kfda' | 'openfda'
}

const sourceLabels: Record<string, string> = {
  local: '등록됨',
  kfda: '식약처',
  openfda: 'FDA',
  dsld: 'NIH',
  ai: 'AI 검색',
}

const sourceColors: Record<string, string> = {
  local: 'bg-blue-100 text-blue-700',
  kfda: 'bg-green-100 text-green-700',
  openfda: 'bg-purple-100 text-purple-700',
  dsld: 'bg-teal-100 text-teal-700',
  ai: 'bg-orange-100 text-orange-700',
}

export function SupplementAddForm({ onSuccess }: { onSuccess?: () => void }) {
  const [data, setData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const updateStr = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value || undefined } as Record<string, string>))
  }

  // 디바운스된 외부 검색
  const searchExternal = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/supplements/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const body = await res.json()
        setSearchResults(body.results || [])
      }
    } catch {
      // 검색 실패 무시
    } finally {
      setSearching(false)
    }
  }, [])

  // 검색어 변경 시 디바운스 검색
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    updateStr('name', value)
    setShowDropdown(value.length > 0)
    setHighlightIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchExternal(value), 300)
  }

  // 검색 결과 선택
  const handleSelectResult = useCallback((result: SearchResult) => {
    setSearchQuery(result.name)
    // 성분 정보가 실제 성분인 경우에만 메모에 저장 (분류 정보는 제외)
    const hasRealIngredients = result.ingredients && !result.ingredients.startsWith('분류:')
    setData({
      name: result.name,
      category: result.category || '',
      ...(hasRealIngredients ? { notes: `성분: ${result.ingredients}` } : {}),
    })
    setShowDropdown(false)
    setHighlightIndex(-1)
  }, [])

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      )
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      handleSelectResult(searchResults[highlightIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json()
        const msg = Array.isArray(body.error)
          ? body.error.map((e: { message: string }) => e.message).join(', ')
          : body.error || '저장에 실패했습니다'
        throw new Error(msg)
      }

      const { supplement } = await res.json()
      triggerAnalysis(supplement.id)

      setData({})
      setSearchQuery('')
      setSearchResults([])
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const triggerAnalysis = (supplementId: string) => {
    fetch('/api/supplements/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplementId, analysisType: 'INGREDIENTS' }),
    }).then(() => {
      onSuccess?.()
    }).catch(() => {
      // 분석 실패 무시
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>약품/보조제 등록</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 제품명 검색 + 자동완성 */}
            <div className="col-span-2 space-y-1.5 relative">
              <Label htmlFor="sup-name">제품명 검색 *</Label>
              <Input
                ref={inputRef}
                id="sup-name"
                type="text"
                required
                autoComplete="off"
                placeholder="약품명을 입력하세요 (한글/영문)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery.length > 0 && setShowDropdown(true)}
                onKeyDown={handleKeyDown}
              />

              {/* 자동완성 드롭다운 */}
              {showDropdown && (searchResults.length > 0 || searching) && (
                <div
                  ref={dropdownRef}
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto"
                >
                  {searching && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      검색 중...
                    </div>
                  )}
                  {searchResults.map((item, index) => (
                    <button
                      key={`${item.source}-${item.name}-${index}`}
                      type="button"
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b last:border-b-0 ${
                        index === highlightIndex ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => handleSelectResult(item)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${sourceColors[item.source] || ''}`}>
                          {sourceLabels[item.source] || item.source}
                        </span>
                      </div>
                      {(item.manufacturer || item.ingredients) && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.manufacturer && <span>{item.manufacturer}</span>}
                          {item.manufacturer && item.ingredients && <span> · </span>}
                          {item.ingredients && <span>{item.ingredients.slice(0, 80)}</span>}
                        </div>
                      )}
                    </button>
                  ))}
                  {!searching && searchResults.length > 0 && (
                    <div className="px-3 py-1.5 text-xs text-muted-foreground bg-gray-50 border-t">
                      목록에 없으면 그대로 입력하여 새로 등록
                    </div>
                  )}
                </div>
              )}

              {/* 검색 결과 없을 때 */}
              {showDropdown && searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg"
                >
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    &quot;{searchQuery}&quot;(으)로 새로 등록합니다
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-category">분류 *</Label>
              <select
                id="sup-category"
                required
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={val(data.category)}
                onChange={(e) => updateStr('category', e.target.value)}
              >
                <option value="">선택</option>
                <option value="PRESCRIPTION">처방약</option>
                <option value="OTC">일반의약품</option>
                <option value="SUPPLEMENT">건강보조식품/영양제</option>
                <option value="HERB">한약/한방 보조제</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-dosage">용량</Label>
              <Input
                id="sup-dosage"
                type="text"
                placeholder="500mg"
                value={val(data.dosage)}
                onChange={(e) => updateStr('dosage', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-frequency">복용 빈도</Label>
              <Input
                id="sup-frequency"
                type="text"
                placeholder="하루 1회"
                value={val(data.frequency)}
                onChange={(e) => updateStr('frequency', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-notes">메모</Label>
              <textarea
                id="sup-notes"
                className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="복용 시 주의사항 등"
                value={val(data.notes)}
                onChange={(e) => updateStr('notes', e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? '등록 중...' : '등록'}
            </Button>
            <p className="text-xs text-muted-foreground">
              등록 후 AI가 자동으로 성분을 분석합니다
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
