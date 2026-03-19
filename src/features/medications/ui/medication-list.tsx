'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

interface MedicationData {
  name: string
  category: 'PRESCRIPTION' | 'OTC' | 'SUPPLEMENT'
  dosage?: string
  frequency?: string
  startDate?: string
  endDate?: string
  notes?: string
}

interface MedicationRecord {
  id: string
  type: 'MEDICATION'
  data: MedicationData
  recordedAt: string
  user?: { id: string; name: string | null }
}

const categoryLabels: Record<string, string> = {
  PRESCRIPTION: '처방약',
  OTC: '일반약',
  SUPPLEMENT: '보조제',
}

const categoryColors: Record<string, string> = {
  PRESCRIPTION: 'bg-blue-100 text-blue-800',
  OTC: 'bg-green-100 text-green-800',
  SUPPLEMENT: 'bg-purple-100 text-purple-800',
}

function isActive(data: MedicationData): boolean {
  if (!data.endDate) return true
  return new Date(data.endDate) >= new Date()
}

export function MedicationList({ refreshKey }: { refreshKey?: number }) {
  const [records, setRecords] = useState<MedicationRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      // 전체 목록을 가져오기 위해 limit을 크게
      const params = new URLSearchParams({ type: 'MEDICATION', limit: '200' })
      const res = await fetch(`/api/health?${params}`)
      if (!res.ok) throw new Error('조회 실패')

      const body = await res.json()
      setRecords(body.records as MedicationRecord[])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords, refreshKey])

  const handleDelete = async (id: string) => {
    if (!confirm('이 복용약 기록을 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/health/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        alert(body.error || '삭제에 실패했습니다')
        return
      }
      fetchRecords()
    } catch {
      alert('삭제 중 오류가 발생했습니다')
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  const activeRecords = records.filter((r) => isActive(r.data))
  const inactiveRecords = records.filter((r) => !isActive(r.data))

  return (
    <div className="space-y-6">
      {/* 복용 중 */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">복용 중</h3>
        {activeRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">복용 중인 약이 없습니다.</p>
        ) : (
          activeRecords.map((record) => (
            <MedicationCard
              key={record.id}
              record={record}
              onDelete={handleDelete}
            />
          ))
        )}
      </section>

      {/* 중단 */}
      {inactiveRecords.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-muted-foreground">중단</h3>
          {inactiveRecords.map((record) => (
            <MedicationCard
              key={record.id}
              record={record}
              onDelete={handleDelete}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function MedicationCard({
  record,
  onDelete,
}: {
  record: MedicationRecord
  onDelete: (id: string) => void
}) {
  const { data } = record
  const category = data.category || 'OTC'

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{data.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[category] || ''}`}
            >
              {categoryLabels[category] || category}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {data.dosage && <span>용량: {data.dosage}</span>}
            {data.frequency && <span>빈도: {data.frequency}</span>}
            {data.startDate && (
              <span>
                기간: {data.startDate}
                {data.endDate ? ` ~ ${data.endDate}` : ' ~ 현재'}
              </span>
            )}
          </div>
          {data.notes && (
            <p className="text-sm text-muted-foreground">{data.notes}</p>
          )}
          {record.user?.name && (
            <p className="text-xs text-muted-foreground">{record.user.name}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(record.id)}
        >
          삭제
        </Button>
      </CardContent>
    </Card>
  )
}
