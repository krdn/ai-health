'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FieldProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function VitalSignFields({ data, onChange }: FieldProps) {
  const update = (key: string, value: string) => {
    onChange({ ...data, [key]: value ? parseFloat(value) : undefined })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="systolic">수축기 혈압 (mmHg)</Label>
        <Input
          id="systolic"
          type="number"
          min={60}
          max={250}
          placeholder="120"
          value={data.systolic ?? ''}
          onChange={(e) => update('systolic', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="diastolic">이완기 혈압 (mmHg)</Label>
        <Input
          id="diastolic"
          type="number"
          min={30}
          max={150}
          placeholder="80"
          value={data.diastolic ?? ''}
          onChange={(e) => update('diastolic', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="heartRate">심박수 (bpm)</Label>
        <Input
          id="heartRate"
          type="number"
          min={30}
          max={220}
          placeholder="72"
          value={data.heartRate ?? ''}
          onChange={(e) => update('heartRate', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bloodSugar">혈당 (mg/dL)</Label>
        <Input
          id="bloodSugar"
          type="number"
          min={20}
          max={600}
          placeholder="100"
          value={data.bloodSugar ?? ''}
          onChange={(e) => update('bloodSugar', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="temperature">체온 (°C)</Label>
        <Input
          id="temperature"
          type="number"
          min={34}
          max={42}
          step={0.1}
          placeholder="36.5"
          value={data.temperature ?? ''}
          onChange={(e) => update('temperature', e.target.value)}
        />
      </div>
    </div>
  )
}
