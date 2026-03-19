import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'
import type { GoalCategory, GoalStatus } from '@/generated/prisma/client'

const goalCreateSchema = z.object({
  category: z.enum([
    'WEIGHT_LOSS', 'WEIGHT_GAIN', 'BLOOD_PRESSURE', 'BLOOD_SUGAR',
    'EXERCISE_FREQ', 'SLEEP', 'STEPS', 'CUSTOM',
  ]),
  targetValue: z.number().min(0),
  unit: z.string().min(1).max(20),
  description: z.string().max(200).optional(),
  targetDate: z.string().datetime().optional(),
})

// GET /api/goals - 건강 목표 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as GoalStatus | null

    const where = {
      userId: session.user.id,
      ...(status ? { status } : {}),
    }

    const goals = await prisma.healthGoal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ goals })
  } catch {
    return NextResponse.json({ error: '목표 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST /api/goals - 건강 목표 생성
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const data = goalCreateSchema.parse(body)

    const goal = await prisma.healthGoal.create({
      data: {
        userId: session.user.id,
        category: data.category as GoalCategory,
        targetValue: data.targetValue,
        unit: data.unit,
        description: data.description || null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: '목표 생성 중 오류가 발생했습니다' }, { status: 500 })
  }
}
