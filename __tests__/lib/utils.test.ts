import { describe, it, expect } from 'vitest'
import { generateInviteCode, hashPassword, verifyPassword } from '@/lib/utils'

describe('generateInviteCode', () => {
  it('8자리 영숫자 코드를 생성한다', () => {
    const code = generateInviteCode()
    expect(code).toMatch(/^[A-Z0-9]{8}$/)
  })

  it('매번 다른 코드를 생성한다', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()))
    expect(codes.size).toBe(100)
  })
})

describe('hashPassword / verifyPassword', () => {
  it('비밀번호를 해시하고 검증한다', async () => {
    const password = 'test-password-123'
    const hashed = await hashPassword(password)
    expect(hashed).not.toBe(password)
    expect(await verifyPassword(password, hashed)).toBe(true)
  })

  it('잘못된 비밀번호는 검증 실패한다', async () => {
    const hashed = await hashPassword('correct-password')
    expect(await verifyPassword('wrong-password', hashed)).toBe(false)
  })
})
