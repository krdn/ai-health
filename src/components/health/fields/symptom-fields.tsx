'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FieldProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

const val = (v: unknown) => (v != null ? String(v) : '')

export function SymptomFields({ data, onChange }: FieldProps) {
  const update = (key: string, value: string) => {
    onChange({ ...data, [key]: value ? parseFloat(value) : undefined })
  }

  const updateStr = (key: string, value: string) => {
    onChange({ ...data, [key]: value || undefined })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="symptom">증상명 *</Label>
        <Input
          id="symptom"
          type="text"
          required
          placeholder="두통, 복통 등"
          value={val(data.symptom)}
          onChange={(e) => updateStr('symptom', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="severity">심각도 (1-10) *</Label>
        <Input
          id="severity"
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
        <Label htmlFor="location">부위</Label>
        <Input
          id="location"
          type="text"
          placeholder="머리, 배 등"
          value={val(data.location)}
          onChange={(e) => updateStr('location', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sym-duration">지속 시간 (분)</Label>
        <Input
          id="sym-duration"
          type="number"
          min={0}
          max={10080}
          placeholder="30"
          value={val(data.duration)}
          onChange={(e) => update('duration', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="trigger">유발 요인</Label>
        <Input
          id="trigger"
          type="text"
          placeholder="스트레스, 음식 등"
          value={val(data.trigger)}
          onChange={(e) => updateStr('trigger', e.target.value)}
        />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="sym-notes">메모</Label>
        <textarea
          id="sym-notes"
          className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="증상에 대한 추가 설명"
          value={val(data.notes)}
          onChange={(e) => updateStr('notes', e.target.value)}
        />
      </div>
    </div>
  )
}
