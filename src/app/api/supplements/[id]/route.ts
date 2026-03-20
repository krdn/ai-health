import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(['PRESCRIPTION', 'OTC', 'SUPPLEMENT', 'HERB']).optional(),
  dosage: z.string().max(50).optional().nullable(),
  frequency: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/supplements/[id] - 약품 상세 조회
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params

    const supplement = await prisma.familySupplement.findUnique({
      where: { id },
      include: { creator: { select: { id: true, name: true } } },
    })

    if (!supplement || supplement.familyId !== session.user.familyId) {
      return NextResponse.json({ error: '약품을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ supplement })
  } catch {
    return NextResponse.json({ error: '약품 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// PATCH /api/supplements/[id] - 약품 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.familySupplement.findUnique({ where: { id } })
    if (!existing || existing.familyId !== session.user.familyId) {
      return NextResponse.json({ error: '약품을 찾을 수 없습니다' }, { status: 404 })
    }

    // 본인 등록 또는 ADMIN만 수정 가능
    if (existing.createdBy !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '수정 권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const supplement = await prisma.familySupplement.update({
      where: { id },
      data,
      include: { creator: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ supplement })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: '약품 수정 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE /api/supplements/[id] - 약품 삭제
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.familySupplement.findUnique({ where: { id } })
    if (!existing || existing.familyId !== session.user.familyId) {
      return NextResponse.json({ error: '약품을 찾을 수 없습니다' }, { status: 404 })
    }

    if (existing.createdBy !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '삭제 권한이 없습니다' }, { status: 403 })
    }

    await prisma.familySupplement.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '약품 삭제 중 오류가 발생했습니다' }, { status: 500 })
  }
}
