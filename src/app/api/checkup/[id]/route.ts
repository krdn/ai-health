import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'

// GET /api/checkup/[id] - 건강검진 기록 상세 조회
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

    const record = await prisma.checkupRecord.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, familyId: true } } },
    })

    if (!record) {
      return NextResponse.json({ error: '기록을 찾을 수 없습니다' }, { status: 404 })
    }

    // 가족 구성원만 조회 가능
    if (record.user.familyId !== session.user.familyId) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    return NextResponse.json({ record })
  } catch {
    return NextResponse.json(
      { error: '건강검진 기록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/checkup/[id] - 건강검진 기록 삭제 (소유자만)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params

    const record = await prisma.checkupRecord.findUnique({
      where: { id },
    })

    if (!record) {
      return NextResponse.json({ error: '기록을 찾을 수 없습니다' }, { status: 404 })
    }

    // 소유자만 삭제 가능
    if (record.userId !== session.user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다' }, { status: 403 })
    }

    // 파일 삭제
    try {
      const fullPath = path.join(process.cwd(), record.filePath)
      await unlink(fullPath)
    } catch {
      // 파일이 이미 없어도 DB 레코드는 삭제
    }

    // DB 레코드 삭제
    await prisma.checkupRecord.delete({ where: { id } })

    return NextResponse.json({ message: '삭제되었습니다' })
  } catch {
    return NextResponse.json(
      { error: '건강검진 기록 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
