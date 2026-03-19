'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

interface CheckupRecord {
  id: string
  fileName: string
  checkupDate: string
  institution: string | null
  summary: string | null
  fileSize: number
  user?: { id: string; name: string | null }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CheckupList() {
  const [records, setRecords] = useState<CheckupRecord[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      const res = await fetch(`/api/checkup?${params}`)
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
    fetchRecords(1)
  }, [fetchRecords])

  const handleDelete = async (id: string) => {
    if (!confirm('이 건강검진 기록을 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/checkup/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        alert(body.error || '삭제에 실패했습니다')
        return
      }
      fetchRecords(pagination.page)
    } catch {
      alert('삭제 중 오류가 발생했습니다')
    }
  }

  const handlePage = (page: number) => {
    fetchRecords(page)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">검진 기록</h3>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-muted-foreground">건강검진 기록이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatDate(record.checkupDate)}</span>
                    {record.institution && (
                      <span className="text-sm text-muted-foreground">
                        - {record.institution}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {record.fileName} ({formatFileSize(record.fileSize)})
                    {record.user?.name && ` | ${record.user.name}`}
                  </p>
                  {record.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {record.summary}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(record.id)}
                >
                  삭제
                </Button>
              </CardContent>
            </Card>
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
