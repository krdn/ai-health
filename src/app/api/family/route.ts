import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInviteCode } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const family = await prisma.family.findUnique({
    where: { id: session.user.familyId },
    include: {
      members: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
    },
  })

  return NextResponse.json(family)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
  }

  const body = await request.json()

  if (body.action === 'regenerateCode') {
    const family = await prisma.family.update({
      where: { id: session.user.familyId },
      data: { inviteCode: generateInviteCode() },
    })
    return NextResponse.json({ inviteCode: family.inviteCode })
  }

  if (body.action === 'updateName' && body.name) {
    const family = await prisma.family.update({
      where: { id: session.user.familyId },
      data: { name: body.name },
    })
    return NextResponse.json({ name: family.name })
  }

  if (body.action === 'changeRole' && body.memberId && body.role) {
    const member = await prisma.user.findUnique({ where: { id: body.memberId } })
    if (!member || member.familyId !== session.user.familyId || member.id === session.user.id) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다' }, { status: 400 })
    }
    const updated = await prisma.user.update({
      where: { id: body.memberId },
      data: { role: body.role },
    })
    return NextResponse.json({ id: updated.id, role: updated.role })
  }

  if (body.action === 'removeMember' && body.memberId) {
    const member = await prisma.user.findUnique({ where: { id: body.memberId } })
    if (!member || member.familyId !== session.user.familyId || member.role === 'ADMIN') {
      return NextResponse.json({ error: '유효하지 않은 요청입니다' }, { status: 400 })
    }
    await prisma.user.delete({ where: { id: body.memberId } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '유효하지 않은 요청입니다' }, { status: 400 })
}
