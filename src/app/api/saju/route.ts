import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { chatWithZhipu, DISCLAIMER } from '@/lib/zhipu'
import { SAJU_SYSTEM_PROMPT } from '@/lib/prompts'
import { buildHealthAnalysisPrompt } from '@/lib/prompts'
import { calculateSaju, formatSajuForPrompt } from '@/lib/saju'
import type { InsightType } from '@/generated/prisma/client'

// POST /api/saju - 사주 건강 분석 (AI)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        birthDate: true,
        birthTime: true,
        gender: true,
        familyId: true,
      },
    })

    if (!user?.birthDate) {
      return NextResponse.json(
        { error: '생년월일 정보가 필요합니다. 설정에서 생년월일을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 일일 사용량 확인
    const familyMembers = await prisma.user.findMany({
      where: { familyId: user.familyId },
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

    if (todayCount >= 10) {
      return NextResponse.json(
        { error: '일일 분석 횟수(10회)를 초과했습니다' },
        { status: 429 }
      )
    }

    // 요청 파싱
    const body = await request.json()
    const { includeHealth } = body as { includeHealth?: boolean }

    // 사주 산출
    const birthHour = user.birthTime ? parseInt(user.birthTime.split(':')[0], 10) : undefined
    const saju = calculateSaju(user.birthDate, birthHour)
    const sajuText = formatSajuForPrompt(saju)

    // 프롬프트 구성
    let userPrompt = `## 사용자 정보\n- 이름: ${user.name}\n`
    if (user.gender) {
      userPrompt += `- 성별: ${user.gender === 'MALE' ? '남성' : '여성'}\n`
    }
    userPrompt += `\n${sajuText}\n`

    // 건강 데이터 포함 여부
    let insightType: InsightType = 'SAJU'
    if (includeHealth) {
      const records = await prisma.healthRecord.findMany({
        where: { userId: user.id },
        orderBy: { recordedAt: 'desc' },
        take: 100,
      })

      if (records.length > 0) {
        const healthPrompt = buildHealthAnalysisPrompt(records, user.name)
        userPrompt += `\n---\n\n${healthPrompt}\n\n위 사주 분석과 건강 데이터를 종합하여 분석해주세요.`
        insightType = 'COMBINED'
      } else {
        userPrompt += '\n건강 기록 데이터가 없으므로 사주 기반 분석만 진행해주세요.'
      }
    } else {
      userPrompt += '\n위 사주팔자를 분석하여 건강 체질 분석을 해주세요.'
    }

    // Zhipu AI 호출
    let aiResponse: string
    try {
      aiResponse = await chatWithZhipu([
        { role: 'system', content: SAJU_SYSTEM_PROMPT },
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
        userId: user.id,
        type: insightType,
        prompt: userPrompt,
        response: fullResponse,
      },
    })

    return NextResponse.json({ insight, saju }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: '사주 분석 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// GET /api/saju - 사주팔자 산출 결과 (AI 미포함)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        birthDate: true,
        birthTime: true,
        gender: true,
      },
    })

    if (!user?.birthDate) {
      return NextResponse.json(
        { error: '생년월일 정보가 필요합니다. 설정에서 생년월일을 입력해주세요.' },
        { status: 400 }
      )
    }

    const birthHour = user.birthTime ? parseInt(user.birthTime.split(':')[0], 10) : undefined
    const saju = calculateSaju(user.birthDate, birthHour)

    return NextResponse.json({ saju })
  } catch {
    return NextResponse.json(
      { error: '사주 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
