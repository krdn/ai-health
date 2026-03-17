import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const goalUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'ACHIEVED', 'ABANDONED']).optional(),
  currentValue: z.number().min(0).optional(),
  targetValue: z.number().min(0).optional(),
})

// PATCH /api/goals/[id] - 건강 목표 수정
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

    const existing = await prisma.healthGoal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '목표를 찾을 수 없습니다' }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: '본인의 목표만 수정할 수 있습니다' }, { status: 403 })
    }

    const body = await request.json()
    const data = goalUpdateSchema.parse(body)

    const goal = await prisma.healthGoal.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.currentValue !== undefined ? { currentValue: data.currentValue } : {}),
        ...(data.targetValue !== undefined ? { targetValue: data.targetValue } : {}),
      },
    })

    return NextResponse.json({ goal })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: '목표 수정 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE /api/goals/[id] - 건강 목표 삭제
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

    const existing = await prisma.healthGoal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '목표를 찾을 수 없습니다' }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: '본인의 목표만 삭제할 수 있습니다' }, { status: 403 })
    }

    await prisma.healthGoal.delete({ where: { id } })

    return NextResponse.json({ message: '목표가 삭제되었습니다' })
  } catch {
    return NextResponse.json({ error: '목표 삭제 중 오류가 발생했습니다' }, { status: 500 })
  }
}
