import { GoalForm } from '@/features/goals'
import { GoalList } from '@/features/goals'

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">건강 목표</h2>
      <GoalForm />
      <GoalList />
    </div>
  )
}
