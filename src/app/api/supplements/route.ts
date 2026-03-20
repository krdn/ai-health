import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'

const createSchema = z.object({
  name: z.string().min(1, '약품명을 입력하세요').max(100),
  category: z.enum(['PRESCRIPTION', 'OTC', 'SUPPLEMENT', 'HERB']),
  dosage: z.string().max(50).optional(),
  frequency: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
})

// GET /api/supplements - 가족 약품 카탈로그 조회 (검색 지원)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    const supplements = await prisma.familySupplement.findMany({
      where: {
        familyId: session.user.familyId,
        ...(query ? { name: { contains: query, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ supplements })
  } catch {
    return NextResponse.json({ error: '약품 목록 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST /api/supplements - 약품 등록
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    const supplement = await prisma.familySupplement.create({
      data: {
        familyId: session.user.familyId,
        createdBy: session.user.id,
        name: data.name,
        category: data.category,
        dosage: data.dosage,
        frequency: data.frequency,
        notes: data.notes,
      },
      include: { creator: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ supplement }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: '약품 등록 중 오류가 발생했습니다' }, { status: 500 })
  }
}
