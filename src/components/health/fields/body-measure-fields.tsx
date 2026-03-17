'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FieldProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

// unknown -> string | number for input value
const val = (v: unknown) => (v != null ? String(v) : '')

export function BodyMeasureFields({ data, onChange }: FieldProps) {
  const update = (key: string, value: string) => {
    onChange({ ...data, [key]: value ? parseFloat(value) : undefined })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="weight">체중 (kg)</Label>
        <Input
          id="weight"
          type="number"
          min={1}
          max={300}
          step={0.1}
          placeholder="70.5"
          value={val(data.weight)}
          onChange={(e) => update('weight', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="height">신장 (cm)</Label>
        <Input
          id="height"
          type="number"
          min={30}
          max={250}
          step={0.1}
          placeholder="175"
          value={val(data.height)}
          onChange={(e) => update('height', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bodyFat">체지방률 (%)</Label>
        <Input
          id="bodyFat"
          type="number"
          min={1}
          max={60}
          step={0.1}
          placeholder="20"
          value={val(data.bodyFat)}
          onChange={(e) => update('bodyFat', e.target.value)}
        />
      </div>
    </div>
  )
}
