import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// 현재 계절 정보
function getSeasonalInfo() {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) {
    return {
      season: '봄',
      icon: '🌸',
      color: 'bg-pink-50 border-pink-200',
      tips: [
        '환절기 면역력 강화를 위해 비타민C 섭취를 늘리세요',
        '꽃가루 알레르기 주의: 외출 후 손씻기와 세안을 철저히',
        '야외 활동 증가 시기 - 자외선 차단제 사용을 시작하세요',
        '봄 나물(냉이, 달래, 쑥)로 제철 영양소를 보충하세요',
      ],
    }
  } else if (month >= 6 && month <= 8) {
    return {
      season: '여름',
      icon: '☀️',
      color: 'bg-amber-50 border-amber-200',
      tips: [
        '탈수 예방: 하루 2L 이상 수분 섭취를 목표로 하세요',
        '식중독 예방: 음식 보관과 조리 시 위생에 주의하세요',
        '냉방병 주의: 실내외 온도 차이를 5도 이내로 유지하세요',
        '무더위 운동은 아침 일찍 또는 저녁에 하세요',
      ],
    }
  } else if (month >= 9 && month <= 11) {
    return {
      season: '가을',
      icon: '🍂',
      color: 'bg-orange-50 border-orange-200',
      tips: [
        '독감 예방접종 적기입니다 (10~11월 권장)',
        '건조한 날씨에 수분 섭취와 보습에 신경 쓰세요',
        '일교차가 큰 시기 - 겉옷을 준비하세요',
        '제철 과일(배, 감, 사과)로 면역력을 높이세요',
      ],
    }
  } else {
    return {
      season: '겨울',
      icon: '❄️',
      color: 'bg-blue-50 border-blue-200',
      tips: [
        '한랭질환 주의: 외출 시 보온에 신경 쓰세요',
        '비타민D 부족 주의: 보충제 섭취를 고려하세요',
        '혈압이 올라가기 쉬운 계절 - 정기적으로 측정하세요',
        '실내 습도 40~60% 유지로 호흡기 건강을 지키세요',
      ],
    }
  }
}

// 기록 타입별 한국어 라벨
const typeLabels: Record<string, string> = {
  BODY_MEASURE: '신체 측정',
  VITAL_SIGN: '활력 징후',
  ACTIVITY: '활동',
  MEDICATION: '복약',
  NUTRITION: '영양',
  SYMPTOM: '증상',
  MENTAL: '정신 건강',
}

// 데이터 요약 텍스트
function summarizeData(type: string, data: Record<string, unknown>): string {
  const parts: string[] = []
  switch (type) {
    case 'BODY_MEASURE':
      if (data.weight) parts.push(`${data.weight}kg`)
      if (data.height) parts.push(`${data.height}cm`)
      break
    case 'VITAL_SIGN':
      if (data.systolic && data.diastolic) parts.push(`혈압 ${data.systolic}/${data.diastolic}`)
      if (data.heartRate) parts.push(`심박 ${data.heartRate}bpm`)
      break
    case 'ACTIVITY':
      if (data.exercise) parts.push(String(data.exercise))
      if (data.steps) parts.push(`${data.steps}걸음`)
      break
    case 'MEDICATION':
      if (data.name) parts.push(String(data.name))
      break
    case 'NUTRITION':
      if (data.meal) {
        const ml: Record<string, string> = { BREAKFAST: '아침', LUNCH: '점심', DINNER: '저녁', SNACK: '간식' }
        parts.push(ml[String(data.meal)] ?? String(data.meal))
      }
      if (data.calories) parts.push(`${data.calories}kcal`)
      break
    case 'SYMPTOM':
      if (data.symptom) parts.push(String(data.symptom))
      break
    case 'MENTAL':
      if (data.mood) parts.push(`기분 ${data.mood}/10`)
      break
  }
  return parts.join(' · ') || '기록'
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) return null

  const userId = session.user.id

  // 데이터 병렬 조회
  const [latestWeight, latestBP, todayActivity, activeGoalsCount, recentRecords] = await Promise.all([
    // 최근 체중
    prisma.healthRecord.findFirst({
      where: { userId, type: 'BODY_MEASURE' },
      orderBy: { recordedAt: 'desc' },
    }),
    // 최근 혈압
    prisma.healthRecord.findFirst({
      where: { userId, type: 'VITAL_SIGN' },
      orderBy: { recordedAt: 'desc' },
    }),
    // 오늘 활동 기록
    prisma.healthRecord.findFirst({
      where: {
        userId,
        type: 'ACTIVITY',
        recordedAt: { gte: new Date(new Date().toISOString().slice(0, 10)) },
      },
      orderBy: { recordedAt: 'desc' },
    }),
    // 활성 목표 수
    prisma.healthGoal.count({
      where: { userId, status: 'ACTIVE' },
    }),
    // 최근 기록 5건
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

      {/* 계절 건강 카드 */}
      <Card className={seasonalInfo.color}>
        <CardHeader>
          <CardTitle>
            {seasonalInfo.icon} {seasonalInfo.season}철 건강 관리 팁
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {seasonalInfo.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground mt-0.5">{'>'}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

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
                      {typeLabels[record.type] || record.type}
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
