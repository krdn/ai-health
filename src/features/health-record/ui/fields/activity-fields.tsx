'use client'

import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

interface FieldProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

const val = (v: unknown) => (v != null ? String(v) : '')

export function ActivityFields({ data, onChange }: FieldProps) {
  const update = (key: string, value: string) => {
    onChange({ ...data, [key]: value ? parseFloat(value) : undefined })
  }

  const updateStr = (key: string, value: string) => {
    onChange({ ...data, [key]: value || undefined })
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor="steps">걸음 수</Label>
        <Input
          id="steps"
          type="number"
          min={0}
          max={100000}
          placeholder="10000"
          value={val(data.steps)}
          onChange={(e) => update('steps', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sleepHours">수면 시간</Label>
        <Input
          id="sleepHours"
          type="number"
          min={0}
          max={24}
          step={0.5}
          placeholder="7.5"
          value={val(data.sleepHours)}
          onChange={(e) => update('sleepHours', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="exercise">운동 종류</Label>
        <Input
          id="exercise"
          type="text"
          maxLength={50}
          placeholder="달리기, 수영 등"
          value={val(data.exercise)}
          onChange={(e) => updateStr('exercise', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="duration">운동 시간 (분)</Label>
        <Input
          id="duration"
          type="number"
          min={0}
          max={1440}
          placeholder="30"
          value={val(data.duration)}
          onChange={(e) => update('duration', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="intensity">운동 강도</Label>
        <select
          id="intensity"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={val(data.intensity)}
          onChange={(e) => updateStr('intensity', e.target.value)}
        >
          <option value="">선택</option>
          <option value="LOW">낮음</option>
          <option value="MODERATE">보통</option>
          <option value="HIGH">높음</option>
          <option value="VERY_HIGH">매우 높음</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="heartRateAvg">평균 심박수 (bpm)</Label>
        <Input
          id="heartRateAvg"
          type="number"
          placeholder="130"
          value={val(data.heartRateAvg)}
          onChange={(e) => update('heartRateAvg', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="heartRateMax">최대 심박수 (bpm)</Label>
        <Input
          id="heartRateMax"
          type="number"
          placeholder="160"
          value={val(data.heartRateMax)}
          onChange={(e) => update('heartRateMax', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="caloriesBurned">소모 칼로리 (kcal)</Label>
        <Input
          id="caloriesBurned"
          type="number"
          placeholder="300"
          value={val(data.caloriesBurned)}
          onChange={(e) => update('caloriesBurned', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rpe">운동 자각도 (1-10)</Label>
        <Input
          id="rpe"
          type="number"
          min={1}
          max={10}
          placeholder="5"
          value={val(data.rpe)}
          onChange={(e) => update('rpe', e.target.value)}
        />
      </div>
    </div>
  )
}
