import { InsightRequest } from '@/components/insight/insight-request'
import { InsightHistory } from '@/components/insight/insight-history'

export default function InsightPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">AI 건강 분석</h2>
      <InsightRequest />
      <InsightHistory />
    </div>
  )
}
