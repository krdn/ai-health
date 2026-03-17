'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecordList } from '@/components/health/record-list'

const val = (v: unknown) => (v != null ? String(v) : '')

function MentalQuickForm() {
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
          type: 'MENTAL',
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
        <CardTitle>정신 건강 기록 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="mt-mood">기분 (1-10)</Label>
              <Input
                id="mt-mood"
                type="number"
                min={1}
                max={10}
                placeholder="7"
                value={val(data.mood)}
                onChange={(e) => update('mood', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mt-stress">스트레스 (1-10)</Label>
              <Input
                id="mt-stress"
                type="number"
                min={1}
                max={10}
                placeholder="4"
                value={val(data.stressLevel)}
                onChange={(e) => update('stressLevel', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mt-anxiety">불안 (1-10)</Label>
              <Input
                id="mt-anxiety"
                type="number"
                min={1}
                max={10}
                placeholder="3"
                value={val(data.anxietyLevel)}
                onChange={(e) => update('anxietyLevel', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mt-energy">에너지 (1-10)</Label>
              <Input
                id="mt-energy"
                type="number"
                min={1}
                max={10}
                placeholder="6"
                value={val(data.energyLevel)}
                onChange={(e) => update('energyLevel', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mt-sleep">수면 질 (1-10)</Label>
              <Input
                id="mt-sleep"
                type="number"
                min={1}
                max={10}
                placeholder="7"
                value={val(data.sleepQuality)}
                onChange={(e) => update('sleepQuality', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mt-notes">메모</Label>
            <textarea
              id="mt-notes"
              className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="오늘의 감정이나 생각"
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

export default function MentalPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">정신 건강</h2>
      <MentalQuickForm />
      <div>
        <h3 className="text-lg font-semibold mb-4">최근 정신 건강 기록</h3>
        <RecordList defaultType="MENTAL" hideFilter />
      </div>
    </div>
  )
}
