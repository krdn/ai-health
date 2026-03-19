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

const quickExercises = ['걷기', '달리기', '자전거', '수영', '웨이트', '요가', '스트레칭', '등산']

export function ExerciseForm() {
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
          type: 'ACTIVITY',
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
        <CardTitle>운동 기록 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 빠른 입력 버튼 */}
          <div className="space-y-1.5">
            <Label>빠른 선택</Label>
            <div className="flex flex-wrap gap-2">
              {quickExercises.map((ex) => (
                <Button
                  key={ex}
                  type="button"
                  size="sm"
                  variant={data.exercise === ex ? 'default' : 'outline'}
                  onClick={() => updateStr('exercise', ex)}
                >
                  {ex}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="ex-exercise">운동 종류</Label>
              <Input
                id="ex-exercise"
                type="text"
                maxLength={50}
                placeholder="달리기"
                value={val(data.exercise)}
                onChange={(e) => updateStr('exercise', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-duration">운동 시간 (분)</Label>
              <Input
                id="ex-duration"
                type="number"
                min={0}
                max={1440}
                placeholder="30"
                value={val(data.duration)}
                onChange={(e) => update('duration', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-intensity">운동 강도</Label>
              <select
                id="ex-intensity"
                className={selectClass}
                value={val(data.intensity)}
                onChange={(e) => updateStr('intensity', e.target.value)}
              >
                <option value="">선택</option>
                <option value="LOW">낮음</option>
                <option value="MODERATE">보통</option>
                <option value="HIGH">높음</option>
                <option value="VERY_HIGH">매우 높음</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-calories">소모 칼로리</Label>
              <Input
                id="ex-calories"
                type="number"
                placeholder="300"
                value={val(data.caloriesBurned)}
                onChange={(e) => update('caloriesBurned', e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? '저장 중...' : '기록 저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
