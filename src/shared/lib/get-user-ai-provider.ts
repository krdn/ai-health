// 현재 세션 사용자의 AI 프로바이더 설정을 가져오는 헬퍼

import { auth } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'

export async function getUserAiProvider(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredAiProvider: true },
  })

  return user?.preferredAiProvider ?? null
}
