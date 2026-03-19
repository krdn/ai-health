import { SymptomQuickForm, RecordList } from '@/features/health-record'

export default function SymptomsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">증상 기록</h2>
      <SymptomQuickForm />
      <div>
        <h3 className="text-lg font-semibold mb-4">최근 증상 기록</h3>
        <RecordList defaultType="SYMPTOM" hideFilter />
      </div>
    </div>
  )
}
