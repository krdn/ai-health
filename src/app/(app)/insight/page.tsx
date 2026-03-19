import { InsightRequest, InsightHistory } from '@/features/insight'

export default function InsightPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">AI 건강 분석</h2>
      <InsightRequest />
      <InsightHistory />
    </div>
  )
}
