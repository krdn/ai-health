'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const val = (v: unknown) => (v != null ? String(v) : '')

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const mealOptions = [
  { value: 'BREAKFAST', label: '아침' },
  { value: 'LUNCH', label: '점심' },
  { value: 'DINNER', label: '저녁' },
  { value: 'SNACK', label: '간식' },
]

export function NutritionForm() {
  const router = useRouter()
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value ? parseFloat(value) : undefined }))
  }

  const updateStr = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value || undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NUTRITION',
          data,
          recordedAt: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        const msg = Array.isArray(body.error)
          ? body.error.map((e: { message: string }) => e.message).join(', ')
          : body.error || '저장에 실패했습니다'
        throw new Error(msg)
      }

      setData({})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>식사 기록 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 식사 구분 빠른 선택 */}
          <div className="space-y-1.5">
            <Label>식사 구분 *</Label>
            <div className="flex gap-2">
              {mealOptions.map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={data.meal === value ? 'default' : 'outline'}
                  onClick={() => updateStr('meal', value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nut-desc">식사 내용</Label>
            <textarea
              id="nut-desc"
              className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="먹은 음식을 적어주세요"
              value={val(data.description)}
              onChange={(e) => updateStr('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="nut-cal">칼로리 (kcal)</Label>
              <Input
                id="nut-cal"
                type="number"
                min={0}
                max={5000}
                placeholder="500"
                value={val(data.calories)}
                onChange={(e) => update('calories', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nut-protein">단백질 (g)</Label>
              <Input
                id="nut-protein"
                type="number"
                placeholder="30"
                value={val(data.protein)}
                onChange={(e) => update('protein', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nut-carbs">탄수화물 (g)</Label>
              <Input
                id="nut-carbs"
                type="number"
                placeholder="60"
                value={val(data.carbs)}
                onChange={(e) => update('carbs', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nut-fat">지방 (g)</Label>
              <Input
                id="nut-fat"
                type="number"
                placeholder="15"
                value={val(data.fat)}
                onChange={(e) => update('fat', e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading || !data.meal}>
            {loading ? '저장 중...' : '기록 저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
