'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const categoryLabels: Record<string, string> = {
  WEIGHT_LOSS: '체중 감량',
  WEIGHT_GAIN: '체중 증가',
  BLOOD_PRESSURE: '혈압 관리',
  BLOOD_SUGAR: '혈당 관리',
  EXERCISE_FREQ: '운동 빈도',
  SLEEP: '수면',
  STEPS: '걸음 수',
  CUSTOM: '사용자 정의',
}

const categoryUnits: Record<string, string> = {
  WEIGHT_LOSS: 'kg',
  WEIGHT_GAIN: 'kg',
  BLOOD_PRESSURE: 'mmHg',
  BLOOD_SUGAR: 'mg/dL',
  EXERCISE_FREQ: '회/주',
  SLEEP: '시간',
  STEPS: '걸음',
  CUSTOM: '',
}

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function GoalForm() {
  const router = useRouter()
  const [category, setCategory] = useState('WEIGHT_LOSS')
  const [targetValue, setTargetValue] = useState('')
  const [unit, setUnit] = useState(categoryUnits['WEIGHT_LOSS'])
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    setUnit(categoryUnits[value] || '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          targetValue: parseFloat(targetValue),
          unit,
          description: description || undefined,
          targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        const msg = Array.isArray(body.error)
          ? body.error.map((e: { message: string }) => e.message).join(', ')
          : body.error || '저장에 실패했습니다'
        throw new Error(msg)
      }

      router.refresh()
      // 폼 초기화
      setTargetValue('')
      setDescription('')
      setTargetDate('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 목표 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="goal-category">목표 카테고리 *</Label>
              <select
                id="goal-category"
                required
                className={selectClass}
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">목표 값 *</Label>
              <Input
                id="goal-target"
                type="number"
                required
                min={0}
                step="any"
                placeholder="목표 수치"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-unit">단위 *</Label>
              <Input
                id="goal-unit"
                type="text"
                required
                maxLength={20}
                placeholder="kg, 회 등"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-date">목표 기한</Label>
              <Input
                id="goal-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="goal-desc">설명</Label>
              <Input
                id="goal-desc"
                type="text"
                maxLength={200}
                placeholder="목표에 대한 간단한 설명"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? '저장 중...' : '목표 추가'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
