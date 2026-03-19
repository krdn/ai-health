import { HealthTimeline } from '@/features/timeline'

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">건강 타임라인</h2>
      <HealthTimeline />
    </div>
  )
}
