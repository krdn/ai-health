import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { hashPassword } from '@/shared/lib/password'
import { generateInviteCode } from '@/shared/lib/invite-code'

const registerSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(50),
    familyName: z.string().min(1).max(50),
  }),
  z.object({
    action: z.literal('join'),
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(50),
    inviteCode: z.string().length(8),
  }),
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existingUser) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(data.password)

    if (data.action === 'create') {
      const family = await prisma.family.create({
        data: { name: data.familyName, inviteCode: generateInviteCode() },
      })

      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: 'ADMIN',
          familyId: family.id,
        },
      })

      return NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        family: { id: family.id, name: family.name, inviteCode: family.inviteCode },
      }, { status: 201 })
    }

    // action === 'join'
    const family = await prisma.family.findUnique({
      where: { inviteCode: data.inviteCode },
    })
    if (!family) {
      return NextResponse.json({ error: '유효하지 않은 초대 코드입니다' }, { status: 404 })
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'MEMBER',
        familyId: family.id,
      },
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      family: { id: family.id, name: family.name },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: '회원가입 처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}
