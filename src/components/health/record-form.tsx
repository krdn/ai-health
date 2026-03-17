'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  type HealthRecordType,
  healthRecordTypeLabels,
} from '@/lib/validations/health-record'

import { BodyMeasureFields } from './fields/body-measure-fields'
import { VitalSignFields } from './fields/vital-sign-fields'
import { ActivityFields } from './fields/activity-fields'
import { MedicationFields } from './fields/medication-fields'
import { NutritionFields } from './fields/nutrition-fields'
import { SymptomFields } from './fields/symptom-fields'
import { MentalFields } from './fields/mental-fields'

const typeKeys = Object.keys(healthRecordTypeLabels) as HealthRecordType[]

// 현재 시각을 datetime-local 형식으로 변환
function toLocalDatetimeString(date: Date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const fieldComponents: Record<
  HealthRecordType,
  React.ComponentType<{
    data: Record<string, unknown>
    onChange: (data: Record<string, unknown>) => void
  }>
> = {
  BODY_MEASURE: BodyMeasureFields,
  VITAL_SIGN: VitalSignFields,
  ACTIVITY: ActivityFields,
  MEDICATION: MedicationFields,
  NUTRITION: NutritionFields,
  SYMPTOM: SymptomFields,
  MENTAL: MentalFields,
}

export function RecordForm() {
  const router = useRouter()
  const [type, setType] = useState<HealthRecordType>('BODY_MEASURE')
  const [data, setData] = useState<Record<string, unknown>>({})
  const [recordedAt, setRecordedAt] = useState(toLocalDatetimeString(new Date()))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTypeChange = (value: unknown) => {
    setType(value as HealthRecordType)
    setData({})
    setError(null)
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
          type,
          data,
          recordedAt: new Date(recordedAt).toISOString(),
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

      router.push('/records')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const FieldComponent = fieldComponents[type]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs
        defaultValue="BODY_MEASURE"
        onValueChange={handleTypeChange}
      >
        <TabsList className="flex-wrap h-auto">
          {typeKeys.map((key) => (
            <TabsTrigger key={key} value={key}>
              {healthRecordTypeLabels[key]}
            </TabsTrigger>
          ))}
        </TabsList>

        {typeKeys.map((key) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardContent>
                <FieldComponent data={data} onChange={setData} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="space-y-1.5">
        <Label htmlFor="recordedAt">기록 일시</Label>
        <Input
          id="recordedAt"
          type="datetime-local"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? '저장 중...' : '기록 저장'}
      </Button>
    </form>
  )
}
