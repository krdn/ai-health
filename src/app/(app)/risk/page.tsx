import { RiskDashboard } from '@/features/risk'

export default function RiskPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">위험도 분석</h2>
      <RiskDashboard />
    </div>
  )
}
