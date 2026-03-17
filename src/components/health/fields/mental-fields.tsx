'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FieldProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function MentalFields({ data, onChange }: FieldProps) {
  const update = (key: string, value: string) => {
    onChange({ ...data, [key]: value ? parseFloat(value) : undefined })
  }

  const updateStr = (key: string, value: string) => {
    onChange({ ...data, [key]: value || undefined })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="mood">기분 (1-10)</Label>
        <Input
          id="mood"
          type="number"
          min={1}
          max={10}
          placeholder="7"
          value={data.mood ?? ''}
          onChange={(e) => update('mood', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stressLevel">스트레스 (1-10)</Label>
        <Input
          id="stressLevel"
          type="number"
          min={1}
          max={10}
          placeholder="4"
          value={data.stressLevel ?? ''}
          onChange={(e) => update('stressLevel', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="anxietyLevel">불안 (1-10)</Label>
        <Input
          id="anxietyLevel"
          type="number"
          min={1}
          max={10}
          placeholder="3"
          value={data.anxietyLevel ?? ''}
          onChange={(e) => update('anxietyLevel', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="energyLevel">에너지 (1-10)</Label>
        <Input
          id="energyLevel"
          type="number"
          min={1}
          max={10}
          placeholder="6"
          value={data.energyLevel ?? ''}
          onChange={(e) => update('energyLevel', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sleepQuality">수면 질 (1-10)</Label>
        <Input
          id="sleepQuality"
          type="number"
          min={1}
          max={10}
          placeholder="7"
          value={data.sleepQuality ?? ''}
          onChange={(e) => update('sleepQuality', e.target.value)}
        />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="mental-notes">메모</Label>
        <textarea
          id="mental-notes"
          className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="오늘의 감정이나 생각"
          value={(data.notes as string) ?? ''}
          onChange={(e) => updateStr('notes', e.target.value)}
        />
      </div>
    </div>
  )
}
