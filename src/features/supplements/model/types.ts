import type { SupplementCategory } from '@/generated/prisma/client'

export interface Ingredient {
  name: string
  amount?: number
  unit?: string
  role?: string
}

export interface SupplementWarnings {
  interactions: string[]
  contraindications: string[]
  sideEffects: string[]
}

export interface FamilySupplementItem {
  id: string
  familyId: string
  name: string
  category: SupplementCategory
  dosage: string | null
  frequency: string | null
  notes: string | null
  ingredients: Ingredient[] | null
  warnings: SupplementWarnings | null
  aiAnalyzedAt: string | null
  createdBy: string
  creator: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

export type MemberSuitability = 'RECOMMENDED' | 'NEUTRAL' | 'CAUTION' | 'AVOID'

export interface MemberSuitabilityResult {
  memberId: string
  memberName: string
  suitability: MemberSuitability
  reasons: string[]
}
