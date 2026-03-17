'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityRecord {
  id: string
  data: {
    exercise?: string
    duration?: number
    heartRateAvg?: number
    caloriesBurned?: number
    steps?: number
  }
  recordedAt: string
}

interface WeekStats {
  count: number
  totalDuration: number
  avgHeartRate: number
  totalCalories: number
  totalSteps: number
}

export function ExerciseSummary() {
  const [stats, setStats] = useState<WeekStats>({
    count: 0, totalDuration: 0, avgHeartRate: 0, totalCalories: 0, totalSteps: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/health?type=ACTIVITY&limit=100')
        if (!res.ok) return
        const body = await res.json()
        const records = body.records as ActivityRecord[]

        // 이번 주 기록 필터
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)

        const weekRecords = records.filter(
          (r) => new Date(r.recordedAt) >= weekStart
        )

        const heartRates = weekRecords
          .map((r) => r.data.heartRateAvg)
          .filter((v): v is number => v != null)

        setStats({
          count: weekRecords.length,
          totalDuration: weekRecords.reduce((sum, r) => sum + (r.data.duration || 0), 0),
          avgHeartRate: heartRates.length > 0
            ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
            : 0,
          totalCalories: weekRecords.reduce((sum, r) => sum + (r.data.caloriesBurned || 0), 0),
          totalSteps: weekRecords.reduce((sum, r) => sum + (r.data.steps || 0), 0),
        })
      } catch {
        // 조용히 실패
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs text-muted-foreground">이번 주 운동</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.count}회</p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs text-muted-foreground">총 운동 시간</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalDuration}분</p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs text-muted-foreground">평균 심박수</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {stats.avgHeartRate > 0 ? `${stats.avgHeartRate}bpm` : '-'}
          </p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs text-muted-foreground">소모 칼로리</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalCalories}kcal</p>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-xs text-muted-foreground">총 걸음 수</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalSteps.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  )
}
