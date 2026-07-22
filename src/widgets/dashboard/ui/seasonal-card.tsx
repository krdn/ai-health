import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { SeasonalInfo } from '../lib/seasonal-info'

interface SeasonalCardProps {
  info: SeasonalInfo
}

export function SeasonalCard({ info }: SeasonalCardProps) {
  return (
    <Card className={info.color}>
      <CardHeader>
        <CardTitle>
          {info.icon} {info.season}철 건강 관리 팁
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {info.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground mt-0.5">{'>'}</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
