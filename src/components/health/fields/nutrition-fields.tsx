'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FieldProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function NutritionFields({ data, onChange }: FieldProps) {
  const update = (key: string, value: string) => {
    onChange({ ...data, [key]: value ? parseFloat(value) : undefined })
  }

  const updateStr = (key: string, value: string) => {
    onChange({ ...data, [key]: value || undefined })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="meal">식사 구분 *</Label>
        <select
          id="meal"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={(data.meal as string) ?? ''}
          onChange={(e) => updateStr('meal', e.target.value)}
        >
          <option value="">선택</option>
          <option value="BREAKFAST">아침</option>
          <option value="LUNCH">점심</option>
          <option value="DINNER">저녁</option>
          <option value="SNACK">간식</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="calories">칼로리 (kcal)</Label>
        <Input
          id="calories"
          type="number"
          min={0}
          max={5000}
          placeholder="500"
          value={data.calories ?? ''}
          onChange={(e) => update('calories', e.target.value)}
        />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="description">식사 내용</Label>
        <textarea
          id="description"
          className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="먹은 음식을 적어주세요"
          value={(data.description as string) ?? ''}
          onChange={(e) => updateStr('description', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="protein">단백질 (g)</Label>
        <Input
          id="protein"
          type="number"
          placeholder="30"
          value={data.protein ?? ''}
          onChange={(e) => update('protein', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="carbs">탄수화물 (g)</Label>
        <Input
          id="carbs"
          type="number"
          placeholder="60"
          value={data.carbs ?? ''}
          onChange={(e) => update('carbs', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fat">지방 (g)</Label>
        <Input
          id="fat"
          type="number"
          placeholder="15"
          value={data.fat ?? ''}
          onChange={(e) => update('fat', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sodium">나트륨 (mg)</Label>
        <Input
          id="sodium"
          type="number"
          placeholder="500"
          value={data.sodium ?? ''}
          onChange={(e) => update('sodium', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="water">수분 섭취 (ml)</Label>
        <Input
          id="water"
          type="number"
          placeholder="250"
          value={data.water ?? ''}
          onChange={(e) => update('water', e.target.value)}
        />
      </div>
    </div>
  )
}
