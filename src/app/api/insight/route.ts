import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { chatWithZhipu, DISCLAIMER } from '@/lib/zhipu'
import {
  HEALTH_SYSTEM_PROMPT,
  buildHealthAnalysisPrompt,
  SUPPLEMENT_SYSTEM_PROMPT,
  SIDE_EFFECT_SYSTEM_PROMPT,
} from '@/lib/prompts'
import type { InsightType, HealthRecordType } from '@/generated/prisma/client'

// 인사이트 타입별 시스템 프롬프트 매핑
const systemPromptMap: Partial<Record<InsightType, string>> = {
  HEALTH: HEALTH_SYSTEM_PROMPT,
  SUPPLEMENT_REC: SUPPLEMENT_SYSTEM_PROMPT,
  SIDE_EFFECT: SIDE_EFFECT_SYSTEM_PROMPT,
}

// 인사이트 타입별 관련 건강 기록 타입 매핑
const relevantRecordTypes: Partial<Record<InsightType, HealthRecordType[]>> = {
  HEALTH: ['BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION', 'NUTRITION', 'SYMPTOM', 'MENTAL'],
  SUPPLEMENT_REC: ['MEDICATION', 'NUTRITION', 'VITAL_SIGN', 'SYMPTOM'],
  SIDE_EFFECT: ['MEDICATION', 'SYMPTOM'],
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
      select: { id: true },
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

    // 프롬프트 구성
    const userPrompt = buildHealthAnalysisPrompt(records, session.user.name)

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
