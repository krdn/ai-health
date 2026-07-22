import { Card, CardContent } from '@/shared/ui/card'

interface StatCardsProps {
  weightData: Record<string, unknown> | null
  bpData: Record<string, unknown> | null
  activityData: Record<string, unknown> | null
  activeGoalsCount: number
}

export function StatCards({ weightData, bpData, activityData, activeGoalsCount }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card size="sm">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground mb-1">최근 체중</p>
          <p className="text-2xl font-bold">
            {weightData?.weight ? `${weightData.weight}kg` : '-'}
          </p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground mb-1">최근 혈압</p>
          <p className="text-2xl font-bold">
            {bpData?.systolic && bpData?.diastolic
              ? `${bpData.systolic}/${bpData.diastolic}`
              : '-'}
          </p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground mb-1">오늘 걸음 수</p>
          <p className="text-2xl font-bold">
            {activityData?.steps ? `${activityData.steps}` : '-'}
          </p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground mb-1">활성 목표</p>
          <p className="text-2xl font-bold">{activeGoalsCount}</p>
        </CardContent>
      </Card>
    </div>
  )
}
