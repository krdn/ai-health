'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface NutritionRecord {
  id: string
  data: {
    meal?: string
    description?: string
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  recordedAt: string
}

const mealLabels: Record<string, string> = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
  SNACK: '간식',
}

interface DailyTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  mealCount: number
}

export function NutritionSummary() {
  const [todayRecords, setTodayRecords] = useState<NutritionRecord[]>([])
  const [totals, setTotals] = useState<DailyTotals>({
    calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/health?type=NUTRITION&limit=50')
        if (!res.ok) return
        const body = await res.json()
        const records = body.records as NutritionRecord[]

        // 오늘 기록 필터
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const today = records.filter(
          (r) => new Date(r.recordedAt) >= todayStart
        )

        setTodayRecords(today)
        setTotals({
          calories: today.reduce((sum, r) => sum + (r.data.calories || 0), 0),
          protein: today.reduce((sum, r) => sum + (r.data.protein || 0), 0),
          carbs: today.reduce((sum, r) => sum + (r.data.carbs || 0), 0),
          fat: today.reduce((sum, r) => sum + (r.data.fat || 0), 0),
          mealCount: today.length,
        })
      } catch {
        // 조용히 실패
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  return (
    <div className="space-y-4">
      {/* 일일 총합 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">오늘 식사</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.mealCount}끼</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">총 칼로리</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.calories}kcal</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">단백질</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.protein}g</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">탄수화물</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.carbs}g</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">지방</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.fat}g</p>
          </CardContent>
        </Card>
      </div>

      {/* 오늘 식사 로그 */}
      {todayRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>오늘의 식사</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayRecords.map((record) => (
                <div key={record.id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium w-12">
                    {mealLabels[record.data.meal || ''] || record.data.meal}
                  </span>
                  <span className="text-foreground/80 flex-1">
                    {record.data.description || '-'}
                  </span>
                  {record.data.calories && (
                    <span className="text-muted-foreground">{record.data.calories}kcal</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
