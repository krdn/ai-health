import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'
import { healthRecordCreateSchema } from '@/features/health-record/model/validation'
import type { HealthRecordType } from '@/generated/prisma/client'

const validTypes: HealthRecordType[] = ['BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION', 'NUTRITION', 'SYMPTOM', 'MENTAL']

// GET /api/health - 건강 기록 목록 조회 (페이지네이션, 타입 필터, 가족 접근)
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

    // 가족 구성원의 기록만 조회 가능
    const familyMembers = await prisma.user.findMany({
      where: { familyId: session.user.familyId },
      select: { id: true },
    })
    const familyMemberIds = familyMembers.map((m) => m.id)

    // userId 필터 (가족 구성원만 허용)
    let targetUserIds: string[]
    if (userId) {
      if (!familyMemberIds.includes(userId)) {
        return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
      }
      targetUserIds = [userId]
    } else {
      targetUserIds = familyMemberIds
    }

    if (type && !validTypes.includes(type as HealthRecordType)) {
      return NextResponse.json({ error: '유효하지 않은 기록 타입입니다' }, { status: 400 })
    }

    const where = {
      userId: { in: targetUserIds },
      ...(type ? { type: type as HealthRecordType } : {}),
    }

    const [records, total] = await Promise.all([
      prisma.healthRecord.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.healthRecord.count({ where }),
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json({ error: '건강 기록 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST /api/health - 건강 기록 생성
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const data = healthRecordCreateSchema.parse(body)

    const record = await prisma.healthRecord.create({
      data: {
        userId: session.user.id,
        type: data.type,
        data: data.data as object,
        recordedAt: new Date(data.recordedAt),
      },
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: '건강 기록 생성 중 오류가 발생했습니다' }, { status: 500 })
  }
}
