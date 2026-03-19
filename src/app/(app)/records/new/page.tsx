import { RecordForm } from '@/features/health-record'

export default function NewRecordPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">건강 기록 입력</h2>
      <RecordForm />
    </div>
  )
}
