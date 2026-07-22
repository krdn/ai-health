'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const val = (v: unknown) => (v != null ? String(v) : '')

export function MedicationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          type: 'MEDICATION',
          data,
          recordedAt: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        const msg =
          Array.isArray(body.error)
            ? body.error.map((e: { message: string }) => e.message).join(', ')
            : body.error || '저장에 실패했습니다'
        throw new Error(msg)
      }

      setData({})
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>복용약/보조제 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="med-name">약 이름 *</Label>
              <Input
                id="med-name"
                type="text"
                required
                placeholder="타이레놀"
                value={val(data.name)}
                onChange={(e) => updateStr('name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-category">분류 *</Label>
              <select
                id="med-category"
                required
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={val(data.category)}
                onChange={(e) => updateStr('category', e.target.value)}
              >
                <option value="">선택</option>
                <option value="PRESCRIPTION">처방약</option>
                <option value="OTC">일반의약품</option>
                <option value="SUPPLEMENT">건강보조식품</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-dosage">용량</Label>
              <Input
                id="med-dosage"
                type="text"
                placeholder="500mg"
                value={val(data.dosage)}
                onChange={(e) => updateStr('dosage', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-frequency">복용 빈도</Label>
              <Input
                id="med-frequency"
                type="text"
                placeholder="하루 3회"
                value={val(data.frequency)}
                onChange={(e) => updateStr('frequency', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-startDate">시작일</Label>
              <Input
                id="med-startDate"
                type="date"
                value={val(data.startDate)}
                onChange={(e) => updateStr('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-endDate">종료일</Label>
              <Input
                id="med-endDate"
                type="date"
                value={val(data.endDate)}
                onChange={(e) => updateStr('endDate', e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="med-notes">메모</Label>
              <textarea
                id="med-notes"
                className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="복용 시 주의사항 등"
                value={val(data.notes)}
                onChange={(e) => updateStr('notes', e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? '저장 중...' : '추가'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
