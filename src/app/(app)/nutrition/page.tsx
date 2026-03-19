import { NutritionSummary } from '@/features/nutrition'
import { NutritionForm } from '@/features/nutrition'
import { RecordList } from '@/features/health-record'

export default function NutritionPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">식단 관리</h2>
      <NutritionSummary />
      <NutritionForm />
      <div>
        <h3 className="text-lg font-semibold mb-4">최근 식사 기록</h3>
        <RecordList defaultType="NUTRITION" hideFilter />
      </div>
    </div>
  )
}
