import { NutritionSummary } from '@/components/nutrition/nutrition-summary'
import { NutritionForm } from '@/components/nutrition/nutrition-form'
import { RecordList } from '@/components/health/record-list'

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
