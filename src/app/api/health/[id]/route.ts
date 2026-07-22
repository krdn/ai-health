import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'
import { healthRecordCreateSchema } from '@/features/health-record/model/validation'

// GET /api/health/[id] - 단일 건강 기록 조회 (가족 구성원도 조회 가능)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params

    const record = await prisma.healthRecord.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, familyId: true } } },
    })

    if (!record) {
      return NextResponse.json({ error: '기록을 찾을 수 없습니다' }, { status: 404 })
    }

    // 같은 가족만 조회 가능
    if (record.user.familyId !== session.user.familyId) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    return NextResponse.json({ record })
  } catch {
    return NextResponse.json({ error: '건강 기록 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// PATCH /api/health/[id] - 건강 기록 수정 (본인만 가능)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.healthRecord.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: '기록을 찾을 수 없습니다' }, { status: 404 })
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: '본인의 기록만 수정할 수 있습니다' }, { status: 403 })
    }

    const body = await request.json()
    const data = healthRecordCreateSchema.parse({
      type: body.type ?? existing.type,
      data: body.data ?? existing.data,
      recordedAt: body.recordedAt ?? existing.recordedAt.toISOString(),
    })

    const record = await prisma.healthRecord.update({
      where: { id },
      data: {
        type: data.type,
        data: data.data as object,
        recordedAt: new Date(data.recordedAt),
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: '건강 기록 수정 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE /api/health/[id] - 건강 기록 삭제 (본인만 가능)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.healthRecord.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: '기록을 찾을 수 없습니다' }, { status: 404 })
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: '본인의 기록만 삭제할 수 있습니다' }, { status: 403 })
    }

    await prisma.healthRecord.delete({ where: { id } })

    return NextResponse.json({ message: '기록이 삭제되었습니다' })
  } catch {
    return NextResponse.json({ error: '건강 기록 삭제 중 오류가 발생했습니다' }, { status: 500 })
  }
}
