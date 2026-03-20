import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'
import { chatWithZhipu, DISCLAIMER } from '@/shared/api/zhipu'
import { INGREDIENT_ANALYSIS_PROMPT, MEMBER_SUITABILITY_PROMPT } from '@/features/supplements/lib/prompts'
import { DAILY_LIMIT, getTodayStartKST } from '@/shared/config/constants'

const analyzeSchema = z.object({
  supplementId: z.string().min(1),
  analysisType: z.enum(['INGREDIENTS', 'MEMBER_SUITABILITY']),
})

// POST /api/supplements/analyze - AI 성분 분석 / 구성원 적합성 분석
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { supplementId, analysisType } = analyzeSchema.parse(body)

    // 약품 조회 + 가족 검증
    const supplement = await prisma.familySupplement.findUnique({
      where: { id: supplementId },
    })

    if (!supplement || supplement.familyId !== session.user.familyId) {
      return NextResponse.json({ error: '약품을 찾을 수 없습니다' }, { status: 404 })
    }

    if (analysisType === 'INGREDIENTS') {
      return handleIngredientAnalysis(supplement)
    }

    // MEMBER_SUITABILITY: rate limit 적용
    const familyMembers = await prisma.user.findMany({
      where: { familyId: session.user.familyId },
      select: { id: true, name: true, gender: true, birthDate: true },
    })
    const familyMemberIds = familyMembers.map((m) => m.id)

    const todayCount = await prisma.insightHistory.count({
      where: {
        userId: { in: familyMemberIds },
        createdAt: { gte: getTodayStartKST() },
      },
    })

    if (todayCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: '일일 분석 횟수(10회)를 초과했습니다' },
        { status: 429 }
      )
    }

    return handleMemberSuitability(supplement, familyMembers, session.user.id)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: '분석 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// 성분 분석
async function handleIngredientAnalysis(
  supplement: { id: string; name: string; category: string }
) {
  const categoryLabels: Record<string, string> = {
    PRESCRIPTION: '처방약',
    OTC: '일반의약품',
    SUPPLEMENT: '건강보조식품',
    HERB: '한약/한방 보조제',
  }

  const userPrompt = `약품명: ${supplement.name}\n분류: ${categoryLabels[supplement.category] || supplement.category}`

  let aiResponse: string
  try {
    aiResponse = await chatWithZhipu([
      { role: 'system', content: INGREDIENT_ANALYSIS_PROMPT },
      { role: 'user', content: userPrompt },
    ])
  } catch {
    return NextResponse.json(
      { error: 'AI 분석을 일시적으로 수행할 수 없습니다' },
      { status: 503 }
    )
  }

  // JSON 파싱
  let parsed: { ingredients?: unknown; warnings?: unknown }
  try {
    // AI 응답에서 JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)```/) || aiResponse.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch?.[1]?.trim() || aiResponse.trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    // 파싱 실패 시 원문 저장
    await prisma.familySupplement.update({
      where: { id: supplement.id },
      data: { aiAnalyzedAt: new Date() },
    })
    return NextResponse.json({
      success: false,
      message: '성분 분석 결과를 파싱할 수 없습니다. 재시도해 주세요.',
      raw: aiResponse,
    })
  }

  // DB 업데이트
  const updated = await prisma.familySupplement.update({
    where: { id: supplement.id },
    data: {
      ingredients: parsed.ingredients as object ?? null,
      warnings: parsed.warnings as object ?? null,
      aiAnalyzedAt: new Date(),
    },
    include: { creator: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ supplement: updated })
}

// 구성원별 적합성 분석
async function handleMemberSuitability(
  supplement: { id: string; name: string; category: string; ingredients: unknown; familyId: string },
  familyMembers: { id: string; name: string; gender: string | null; birthDate: Date | null }[],
  requestUserId: string,
) {
  if (!supplement.ingredients) {
    return NextResponse.json(
      { error: '먼저 성분 분석을 실행해 주세요' },
      { status: 400 }
    )
  }

  // 각 구성원의 최근 건강 기록 조회
  const memberIds = familyMembers.map((m) => m.id)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const healthRecords = await prisma.healthRecord.findMany({
    where: {
      userId: { in: memberIds },
      type: { in: ['MEDICATION', 'VITAL_SIGN', 'SYMPTOM'] },
      recordedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { recordedAt: 'desc' },
    take: 200,
    include: { user: { select: { id: true, name: true } } },
  })

  // 구성원별 데이터 정리
  const memberProfiles = familyMembers.map((member) => {
    const records = healthRecords.filter((r) => r.userId === member.id)
    const medications = records.filter((r) => r.type === 'MEDICATION')
    const symptoms = records.filter((r) => r.type === 'SYMPTOM')
    const vitals = records.filter((r) => r.type === 'VITAL_SIGN')

    const age = member.birthDate
      ? Math.floor((Date.now() - member.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null

    return {
      name: member.name,
      gender: member.gender === 'MALE' ? '남성' : member.gender === 'FEMALE' ? '여성' : '미지정',
      age: age ? `${age}세` : '미지정',
      currentMedications: medications.map((r) => JSON.stringify(r.data)).join('\n'),
      recentSymptoms: symptoms.map((r) => JSON.stringify(r.data)).join('\n'),
      recentVitals: vitals.map((r) => JSON.stringify(r.data)).join('\n'),
    }
  })

  const userPrompt = `## 분석 대상 약품
이름: ${supplement.name}
성분: ${JSON.stringify(supplement.ingredients)}

## 가족 구성원 건강 프로파일
${memberProfiles.map((p) => `
### ${p.name} (${p.gender}, ${p.age})
현재 복용 약물:
${p.currentMedications || '없음'}
최근 30일 증상:
${p.recentSymptoms || '없음'}
최근 30일 바이탈:
${p.recentVitals || '없음'}
`).join('\n')}`

  let aiResponse: string
  try {
    aiResponse = await chatWithZhipu([
      { role: 'system', content: MEMBER_SUITABILITY_PROMPT },
      { role: 'user', content: userPrompt },
    ])
  } catch {
    return NextResponse.json(
      { error: 'AI 분석을 일시적으로 수행할 수 없습니다' },
      { status: 503 }
    )
  }

  // InsightHistory에 저장
  await prisma.insightHistory.create({
    data: {
      userId: requestUserId,
      type: 'SUPPLEMENT_INTERACTION',
      prompt: userPrompt,
      response: aiResponse + DISCLAIMER,
    },
  })

  // JSON 파싱
  let parsed: { results?: unknown; overallNotes?: string }
  try {
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)```/) || aiResponse.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch?.[1]?.trim() || aiResponse.trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json({
      success: true,
      raw: aiResponse + DISCLAIMER,
      message: '분석이 완료되었으나 구조화된 형식이 아닙니다.',
    })
  }

  return NextResponse.json({
    results: parsed.results,
    overallNotes: parsed.overallNotes,
    disclaimer: DISCLAIMER,
  })
}
