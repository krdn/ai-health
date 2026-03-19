import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'

// GET /api/insight/[id] - 단일 인사이트 조회 (가족 구성원 접근 가능)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params

    const insight = await prisma.insightHistory.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, familyId: true } } },
    })

    if (!insight) {
      return NextResponse.json({ error: '인사이트를 찾을 수 없습니다' }, { status: 404 })
    }

    // 가족 구성원만 접근 가능
    if (insight.user.familyId !== session.user.familyId) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    // familyId 제거 후 반환
    const { user, ...rest } = insight
    const { familyId: _, ...userWithoutFamily } = user

    return NextResponse.json({
      insight: { ...rest, user: userWithoutFamily },
    })
  } catch {
    return NextResponse.json(
      { error: '인사이트 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
