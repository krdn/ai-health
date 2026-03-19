'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'

interface HealthGoal {
  id: string
  category: string
  targetValue: number
  currentValue: number | null
  unit: string
  description: string | null
  startDate: string
  targetDate: string | null
  status: string
}

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

const statusLabels: Record<string, string> = {
  ACTIVE: '활성',
  ACHIEVED: '달성',
  ABANDONED: '중단',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  ACTIVE: 'default',
  ACHIEVED: 'secondary',
  ABANDONED: 'destructive',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

export function GoalList() {
  const [goals, setGoals] = useState<HealthGoal[]>([])
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const fetchGoals = useCallback(async (status: string | null) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      const res = await fetch(`/api/goals?${params}`)
      if (!res.ok) throw new Error()
      const body = await res.json()
      setGoals(body.goals)
    } catch {
      setGoals([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGoals(statusFilter)
  }, [statusFilter, fetchGoals])

  const updateGoal = async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        fetchGoals(statusFilter)
      }
    } catch {
      // 조용히 실패
    }
  }

  const deleteGoal = async (id: string) => {
    if (!confirm('이 목표를 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchGoals(statusFilter)
      }
    } catch {
      // 조용히 실패
    }
  }

  const handleUpdateValue = (id: string) => {
    if (!editValue) return
    updateGoal(id, { currentValue: parseFloat(editValue) })
    setEditingId(null)
    setEditValue('')
  }

  return (
    <div className="space-y-4">
      {/* 상태 필터 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter(null)}
        >
          전체
        </Button>
        {Object.entries(statusLabels).map(([key, label]) => (
          <Button
            key={key}
            variant={statusFilter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 목표 목록 */}
      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 목표가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const progress = goal.currentValue != null
              ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
              : 0

            return (
              <Card key={goal.id} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{categoryLabels[goal.category] || goal.category}</span>
                    <Badge variant={statusVariants[goal.status] || 'outline'}>
                      {statusLabels[goal.status] || goal.status}
                    </Badge>
                    {goal.targetDate && (
                      <span className="text-xs text-muted-foreground font-normal ml-auto">
                        목표: {formatDate(goal.targetDate)}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {goal.description && (
                    <p className="text-sm text-foreground/80">{goal.description}</p>
                  )}

                  {/* 진행률 바 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {goal.currentValue != null ? goal.currentValue : 0} / {goal.targetValue} {goal.unit}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-wrap items-center gap-2">
                    {editingId === goal.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="any"
                          className="w-24 h-7 text-sm"
                          placeholder="현재 값"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateValue(goal.id)}
                        />
                        <Button size="sm" variant="outline" onClick={() => handleUpdateValue(goal.id)}>
                          확인
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditValue('') }}>
                          취소
                        </Button>
                      </div>
                    ) : (
                      <>
                        {goal.status === 'ACTIVE' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setEditingId(goal.id); setEditValue('') }}>
                              현재값 수정
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateGoal(goal.id, { status: 'ACHIEVED' })}>
                              달성
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateGoal(goal.id, { status: 'ABANDONED' })}>
                              중단
                            </Button>
                          </>
                        )}
                        {goal.status !== 'ACTIVE' && (
                          <Button size="sm" variant="outline" onClick={() => updateGoal(goal.id, { status: 'ACTIVE' })}>
                            다시 활성화
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => deleteGoal(goal.id)}>
                          삭제
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
