import { MentalQuickForm, RecordList } from '@/features/health-record'

export default function MentalPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">정신 건강</h2>
      <MentalQuickForm />
      <div>
        <h3 className="text-lg font-semibold mb-4">최근 정신 건강 기록</h3>
        <RecordList defaultType="MENTAL" hideFilter />
      </div>
    </div>
  )
}
