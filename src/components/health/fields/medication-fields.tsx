'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FieldProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

const val = (v: unknown) => (v != null ? String(v) : '')

export function MedicationFields({ data, onChange }: FieldProps) {
  const updateStr = (key: string, value: string) => {
    onChange({ ...data, [key]: value || undefined })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">약 이름 *</Label>
        <Input
          id="name"
          type="text"
          required
          placeholder="타이레놀"
          value={val(data.name)}
          onChange={(e) => updateStr('name', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">분류 *</Label>
        <select
          id="category"
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
        <Label htmlFor="dosage">용량</Label>
        <Input
          id="dosage"
          type="text"
          placeholder="500mg"
          value={val(data.dosage)}
          onChange={(e) => updateStr('dosage', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="frequency">복용 빈도</Label>
        <Input
          id="frequency"
          type="text"
          placeholder="하루 3회"
          value={val(data.frequency)}
          onChange={(e) => updateStr('frequency', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="startDate">시작일</Label>
        <Input
          id="startDate"
          type="date"
          value={val(data.startDate)}
          onChange={(e) => updateStr('startDate', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="endDate">종료일</Label>
        <Input
          id="endDate"
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
  )
}
