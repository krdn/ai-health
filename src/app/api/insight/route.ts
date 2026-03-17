import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { chatWithZhipu, DISCLAIMER } from '@/lib/zhipu'
import {
  HEALTH_SYSTEM_PROMPT,
  buildHealthAnalysisPrompt,
  SUPPLEMENT_SYSTEM_PROMPT,
  SIDE_EFFECT_SYSTEM_PROMPT,
  RISK_ASSESSMENT_SYSTEM_PROMPT,
  EXERCISE_RX_SYSTEM_PROMPT,
  NUTRITION_ANALYSIS_SYSTEM_PROMPT,
  CORRELATION_SYSTEM_PROMPT,
} from '@/lib/prompts'
import type { InsightType, HealthRecordType } from '@/generated/prisma/client'

// 인사이트 타입별 시스템 프롬프트 매핑
const systemPromptMap: Partial<Record<InsightType, string>> = {
  HEALTH: HEALTH_SYSTEM_PROMPT,
  SUPPLEMENT_REC: SUPPLEMENT_SYSTEM_PROMPT,
  SIDE_EFFECT: SIDE_EFFECT_SYSTEM_PROMPT,
  RISK_ASSESSMENT: RISK_ASSESSMENT_SYSTEM_PROMPT,
  EXERCISE_RX: EXERCISE_RX_SYSTEM_PROMPT,
  NUTRITION_ANALYSIS: NUTRITION_ANALYSIS_SYSTEM_PROMPT,
  CORRELATION: CORRELATION_SYSTEM_PROMPT,
  SEASONAL: HEALTH_SYSTEM_PROMPT, // 계절 분석은 건강 프롬프트 + 계절 컨텍스트
  FAMILY_PATTERN: HEALTH_SYSTEM_PROMPT, // 가족 패턴은 건강 프롬프트 + 가족 데이터
  COMBINED: HEALTH_SYSTEM_PROMPT, // 종합 분석
}

// 인사이트 타입별 관련 건강 기록 타입 매핑
const relevantRecordTypes: Partial<Record<InsightType, HealthRecordType[]>> = {
  HEALTH: ['BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION', 'NUTRITION', 'SYMPTOM', 'MENTAL'],
  SUPPLEMENT_REC: ['MEDICATION', 'NUTRITION', 'VITAL_SIGN', 'SYMPTOM'],
  SIDE_EFFECT: ['MEDICATION', 'SYMPTOM'],
  RISK_ASSESSMENT: ['BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION', 'NUTRITION', 'SYMPTOM', 'MENTAL'],
  EXERCISE_RX: ['BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION', 'SYMPTOM'],
  NUTRITION_ANALYSIS: ['NUTRITION', 'BODY_MEASURE', 'VITAL_SIGN', 'MEDICATION', 'SYMPTOM'],
  CORRELATION: ['BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION', 'NUTRITION', 'SYMPTOM', 'MENTAL'],
  SEASONAL: ['BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'SYMPTOM', 'MENTAL'],
  FAMILY_PATTERN: ['BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION', 'NUTRITION', 'SYMPTOM', 'MENTAL'],
  COMBINED: ['BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION', 'NUTRITION', 'SYMPTOM', 'MENTAL'],
}

// 현재 계절 정보 반환
function getSeasonInfo(): { season: string; month: number; advice: string } {
  const now = new Date()
  const month = now.getMonth() + 1

  if (month >= 3 && month <= 5) {
    return { season: '봄', month, advice: '환절기 면역력 관리, 꽃가루 알레르기 주의, 야외 활동 증가 시기' }
  } else if (month >= 6 && month <= 8) {
    return { season: '여름', month, advice: '열사병/탈수 주의, 식중독 예방, 자외선 차단, 냉방병 주의' }
  } else if (month >= 9 && month <= 11) {
    return { season: '가을', month, advice: '환절기 면역력 관리, 건조한 공기 대비 수분 섭취, 독감 예방접종 시기' }
  } else {
    return { season: '겨울', month, advice: '한랭질환 주의, 실내 건조 관리, 비타민D 보충, 혈압 상승 주의' }
  }
}

const DAILY_LIMIT = 10

// POST /api/insight - AI 인사이트 생성
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 가족 구성원의 일일 사용량 확인 (rate limit)
    const familyMembers = await prisma.user.findMany({
      where: { familyId: session.user.familyId },
      select: { id: true, name: true },
    })
    const familyMemberIds = familyMembers.map((m) => m.id)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayCount = await prisma.insightHistory.count({
      where: {
        userId: { in: familyMemberIds },
        createdAt: { gte: todayStart },
      },
    })

    if (todayCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: '일일 분석 횟수(10회)를 초과했습니다' },
        { status: 429 }
      )
    }

    // 요청 파싱
    const body = await request.json()
    const { type, fromDate, toDate } = body as {
      type: InsightType
      fromDate?: string
      toDate?: string
    }

    if (!type) {
      return NextResponse.json({ error: '분석 타입이 필요합니다' }, { status: 400 })
    }

    const systemPrompt = systemPromptMap[type]
    if (!systemPrompt) {
      return NextResponse.json(
        { error: '지원하지 않는 분석 타입입니다' },
        { status: 400 }
      )
    }

    // 날짜 범위 설정
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (fromDate) dateFilter.gte = new Date(fromDate)
    if (toDate) dateFilter.lte = new Date(toDate)

    // 관련 건강 기록 조회
    const recordTypes = relevantRecordTypes[type] || []
    const records = await prisma.healthRecord.findMany({
      where: {
        userId: session.user.id,
        type: { in: recordTypes },
        ...(Object.keys(dateFilter).length > 0 ? { recordedAt: dateFilter } : {}),
      },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    })

    // 프롬프트 구성 (타입별 특화)
    let userPrompt = buildHealthAnalysisPrompt(records, session.user.name)

    // SEASONAL: 계절 정보 추가
    if (type === 'SEASONAL') {
      const seasonInfo = getSeasonInfo()
      userPrompt = `## 현재 계절 정보\n- 계절: ${seasonInfo.season}\n- 월: ${seasonInfo.month}월\n- 계절 특성: ${seasonInfo.advice}\n\n위 계절 정보를 고려하여 현재 시기에 맞는 건강 관리 방안을 분석해주세요.\n특히 계절 변화에 따른 건강 위험 요인과 예방 전략을 포함해주세요.\n\n${userPrompt}`
    }

    // FAMILY_PATTERN: 가족 구성원 전체 데이터 포함
    if (type === 'FAMILY_PATTERN') {
      const familyRecords = await prisma.healthRecord.findMany({
        where: {
          userId: { in: familyMemberIds },
          type: { in: recordTypes },
          ...(Object.keys(dateFilter).length > 0 ? { recordedAt: dateFilter } : {}),
        },
        orderBy: { recordedAt: 'desc' },
        take: 200,
        include: { user: { select: { name: true } } },
      })

      const familyDataText = familyRecords.map((r) => {
        const date = new Date(r.recordedAt).toLocaleDateString('ko-KR')
        return `- [${r.user.name}] [${date}] ${r.type}: ${JSON.stringify(r.data)}`
      }).join('\n')

      const memberNames = familyMembers.map((m) => m.name).join(', ')
      userPrompt = `## 가족 구성원: ${memberNames}\n\n## 가족 전체 건강 기록\n${familyDataText}\n\n가족 구성원 간의 건강 패턴을 비교 분석해주세요.\n공통 위험 요인, 가족력 추정, 가족 단위 건강 관리 방안을 제안해주세요.\n\n${userPrompt}`
    }

    // COMBINED: 종합 분석 안내 추가
    if (type === 'COMBINED') {
      const seasonInfo = getSeasonInfo()
      userPrompt = `## 종합 분석 요청\n현재 계절: ${seasonInfo.season} (${seasonInfo.month}월)\n\n다음 항목을 모두 포함하여 종합적으로 분석해주세요:\n1. 건강 위험도 평가\n2. 영양 상태 분석\n3. 운동 권장사항\n4. 계절별 건강 관리\n5. 데이터 간 상관관계\n\n${userPrompt}`
    }

    // Zhipu AI 호출
    let aiResponse: string
    try {
      aiResponse = await chatWithZhipu([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ])
    } catch {
      return NextResponse.json(
        { error: '분석을 일시적으로 수행할 수 없습니다' },
        { status: 503 }
      )
    }

    // 면책 조항 추가
    const fullResponse = aiResponse + DISCLAIMER

    // InsightHistory 저장
    const insight = await prisma.insightHistory.create({
      data: {
        userId: session.user.id,
        type,
        prompt: userPrompt,
        response: fullResponse,
        fromDate: dateFilter.gte || null,
        toDate: dateFilter.lte || null,
      },
    })

    return NextResponse.json({ insight }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: '인사이트 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// GET /api/insight - 인사이트 목록 조회 (페이지네이션, 타입 필터)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')

    // 가족 구성원의 인사이트만 조회 가능
    const familyMembers = await prisma.user.findMany({
      where: { familyId: session.user.familyId },
      select: { id: true },
    })
    const familyMemberIds = familyMembers.map((m) => m.id)

    let targetUserIds: string[]
    if (userId) {
      if (!familyMemberIds.includes(userId)) {
        return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
      }
      targetUserIds = [userId]
    } else {
      targetUserIds = familyMemberIds
    }

    const where = {
      userId: { in: targetUserIds },
      ...(type ? { type: type as InsightType } : {}),
    }

    const [insights, total] = await Promise.all([
      prisma.insightHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.insightHistory.count({ where }),
    ])

    return NextResponse.json({
      insights,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json(
      { error: '인사이트 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
