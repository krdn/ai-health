// User 도메인 관련 타입
export type UserRole = 'ADMIN' | 'MEMBER'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  familyId: string
  birthDate?: Date | null
  birthTime?: string | null
  gender?: string | null
}
