'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecordList } from '@/components/health/record-list'

const val = (v: unknown) => (v != null ? String(v) : '')

function SymptomQuickForm() {
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
          type: 'SYMPTOM',
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
        <CardTitle>증상 기록 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="sym-name">증상명 *</Label>
              <Input
                id="sym-name"
                type="text"
                required
                placeholder="두통, 복통 등"
                value={val(data.symptom)}
                onChange={(e) => updateStr('symptom', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sym-sev">심각도 (1-10) *</Label>
              <Input
                id="sym-sev"
                type="number"
                required
                min={1}
                max={10}
                placeholder="5"
                value={val(data.severity)}
                onChange={(e) => update('severity', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sym-loc">부위</Label>
              <Input
                id="sym-loc"
                type="text"
                placeholder="머리, 배 등"
                value={val(data.location)}
                onChange={(e) => updateStr('location', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sym-trigger">유발 요인</Label>
              <Input
                id="sym-trigger"
                type="text"
                placeholder="스트레스, 음식 등"
                value={val(data.trigger)}
                onChange={(e) => updateStr('trigger', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sym-note">메모</Label>
            <textarea
              id="sym-note"
              className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="증상에 대한 추가 설명"
              value={val(data.notes)}
              onChange={(e) => updateStr('notes', e.target.value)}
            />
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

export default function SymptomsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">증상 기록</h2>
      <SymptomQuickForm />
      <div>
        <h3 className="text-lg font-semibold mb-4">최근 증상 기록</h3>
        <RecordList defaultType="SYMPTOM" hideFilter />
      </div>
    </div>
  )
}
