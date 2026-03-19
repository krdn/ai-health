import { ExerciseSummary } from '@/features/exercise'
import { ExerciseForm } from '@/features/exercise'
import { RecordList } from '@/features/health-record'

export default function ExercisePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">운동</h2>
      <ExerciseSummary />
      <ExerciseForm />
      <div>
        <h3 className="text-lg font-semibold mb-4">최근 운동 기록</h3>
        <RecordList defaultType="ACTIVITY" hideFilter />
      </div>
    </div>
  )
}
