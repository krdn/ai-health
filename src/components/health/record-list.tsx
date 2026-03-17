'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { RecordCard } from './record-card'
import {
  type HealthRecordType,
  healthRecordTypeLabels,
} from '@/lib/validations/health-record'

const typeKeys = Object.keys(healthRecordTypeLabels) as HealthRecordType[]

interface HealthRecord {
  id: string
  type: HealthRecordType
  data: Record<string, unknown>
  recordedAt: string
  user?: { id: string; name: string | null }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface RecordListProps {
  defaultType?: HealthRecordType
  hideFilter?: boolean
}

export function RecordList({ defaultType, hideFilter }: RecordListProps = {}) {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  })
  const [typeFilter, setTypeFilter] = useState<HealthRecordType | null>(defaultType ?? null)
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async (page: number, type: HealthRecordType | null) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (type) params.set('type', type)

      const res = await fetch(`/api/health?${params}`)
      if (!res.ok) throw new Error('조회 실패')

      const body = await res.json()
      setRecords(body.records)
      setPagination(body.pagination)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords(1, typeFilter)
  }, [typeFilter, fetchRecords])

  const handleFilterChange = (type: HealthRecordType | null) => {
    setTypeFilter(type)
  }

  const handlePage = (page: number) => {
    fetchRecords(page, typeFilter)
  }

  return (
    <div className="space-y-4">
      {/* 타입 필터 */}
      {!hideFilter && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={typeFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(null)}
          >
            전체
          </Button>
          {typeKeys.map((key) => (
            <Button
              key={key}
              variant={typeFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(key)}
            >
              {healthRecordTypeLabels[key]}
            </Button>
          ))}
        </div>
      )}

      {/* 기록 목록 */}
      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-muted-foreground">기록이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => handlePage(pagination.page - 1)}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePage(pagination.page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
