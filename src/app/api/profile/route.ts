import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'

// GET /api/profile - 프로필 조회
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        birthDate: true,
        birthTime: true,
        birthCalendarType: true,
        gender: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json(
      { error: '프로필 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PATCH /api/profile - 프로필 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { birthDate, birthTime, birthCalendarType, gender } = body as {
      birthDate?: string
      birthTime?: string
      birthCalendarType?: 'SOLAR' | 'LUNAR'
      gender?: 'MALE' | 'FEMALE'
    }

    // 업데이트할 필드만 구성
    const updateData: Record<string, unknown> = {}

    if (birthDate !== undefined) {
      updateData.birthDate = birthDate ? new Date(birthDate) : null
    }
    if (birthTime !== undefined) {
      // HH:mm 형식 검증
      if (birthTime && !/^\d{2}:\d{2}$/.test(birthTime)) {
        return NextResponse.json(
          { error: '출생 시간은 HH:mm 형식이어야 합니다' },
          { status: 400 }
        )
      }
      updateData.birthTime = birthTime || null
    }
    if (birthCalendarType !== undefined) {
      if (birthCalendarType && !['SOLAR', 'LUNAR'].includes(birthCalendarType)) {
        return NextResponse.json(
          { error: '달력 유형은 SOLAR 또는 LUNAR이어야 합니다' },
          { status: 400 }
        )
      }
      updateData.birthCalendarType = birthCalendarType || null
    }
    if (gender !== undefined) {
      if (gender && !['MALE', 'FEMALE'].includes(gender)) {
        return NextResponse.json(
          { error: '성별은 MALE 또는 FEMALE이어야 합니다' },
          { status: 400 }
        )
      }
      updateData.gender = gender || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 항목이 없습니다' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        birthDate: true,
        birthTime: true,
        birthCalendarType: true,
        gender: true,
      },
    })

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json(
      { error: '프로필 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
