import Link from 'next/link'
import { auth } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { healthRecordTypeLabels, summarizeData } from '@/features/health-record/model/types'
import { StatCards } from './stat-cards'
import { SeasonalCard } from './seasonal-card'
import { getSeasonalInfo } from '../lib/seasonal-info'

export async function DashboardPage() {
  const session = await auth()
  if (!session?.user) return null

  const userId = session.user.id

  // 데이터 병렬 조회
  const [latestWeight, latestBP, todayActivity, activeGoalsCount, recentRecords] = await Promise.all([
    prisma.healthRecord.findFirst({
      where: { userId, type: 'BODY_MEASURE' },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.healthRecord.findFirst({
      where: { userId, type: 'VITAL_SIGN' },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.healthRecord.findFirst({
      where: {
        userId,
        type: 'ACTIVITY',
        recordedAt: { gte: new Date(new Date().toISOString().slice(0, 10)) },
      },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.healthGoal.count({
      where: { userId, status: 'ACTIVE' },
    }),
    prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 5,
    }),
  ])

  const weightData = latestWeight?.data as Record<string, unknown> | null
  const bpData = latestBP?.data as Record<string, unknown> | null
  const activityData = todayActivity?.data as Record<string, unknown> | null
  const seasonalInfo = getSeasonalInfo()

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div>
        <h2 className="text-2xl font-bold">
          안녕하세요, {session.user.name}님!
        </h2>
        <p className="text-muted-foreground">오늘의 건강 현황을 확인하세요.</p>
      </div>

      {/* 통계 카드 */}
      <StatCards
        weightData={weightData}
        bpData={bpData}
        activityData={activityData}
        activeGoalsCount={activeGoalsCount}
      />

      {/* 계절 건강 카드 */}
      <SeasonalCard info={seasonalInfo} />

      {/* 최근 기록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>최근 건강 기록</span>
            <Link href="/records">
              <Button variant="outline" size="sm">전체 보기</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 건강 기록이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((record) => {
                const data = record.data as Record<string, unknown>
                return (
                  <div key={record.id} className="flex items-center gap-3 text-sm">
                    <Badge variant="secondary">
                      {healthRecordTypeLabels[record.type] || record.type}
                    </Badge>
                    <span className="flex-1 text-foreground/80 truncate">
                      {summarizeData(record.type, data)}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(record.recordedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 바로가기 버튼 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/records/new">
          <Button variant="outline" className="w-full h-12">
            기록 추가
          </Button>
        </Link>
        <Link href="/insight">
          <Button variant="outline" className="w-full h-12">
            AI 분석
          </Button>
        </Link>
        <Link href="/goals">
          <Button variant="outline" className="w-full h-12">
            목표 관리
          </Button>
        </Link>
      </div>
    </div>
  )
}
