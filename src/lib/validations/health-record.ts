import { z } from 'zod'

// --- 개별 데이터 타입 스키마 ---

export const bodyMeasureSchema = z.object({
  weight: z.number().min(1).max(300).optional(),
  height: z.number().min(30).max(250).optional(),
  bodyFat: z.number().min(1).max(60).optional(),
})

export const vitalSignSchema = z.object({
  systolic: z.number().min(60).max(250).optional(),
  diastolic: z.number().min(30).max(150).optional(),
  heartRate: z.number().min(30).max(220).optional(),
  bloodSugar: z.number().min(20).max(600).optional(),
  temperature: z.number().min(34).max(42).optional(),
})

export const activitySchema = z.object({
  steps: z.number().min(0).max(100000).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  exercise: z.string().max(50).optional(),
  duration: z.number().min(0).max(1440).optional(),
  intensity: z.enum(['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']).optional(),
  heartRateAvg: z.number().optional(),
  heartRateMax: z.number().optional(),
  caloriesBurned: z.number().optional(),
  rpe: z.number().min(1).max(10).optional(),
})

export const medicationSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['PRESCRIPTION', 'OTC', 'SUPPLEMENT']),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
})

export const nutritionSchema = z.object({
  meal: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  description: z.string().optional(),
  calories: z.number().min(0).max(5000).optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  sodium: z.number().optional(),
  water: z.number().optional(),
})

export const symptomSchema = z.object({
  symptom: z.string().min(1),
  severity: z.number().min(1).max(10),
  location: z.string().optional(),
  duration: z.number().min(0).max(10080).optional(),
  trigger: z.string().optional(),
  notes: z.string().optional(),
})

export const mentalSchema = z.object({
  mood: z.number().min(1).max(10).optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  anxietyLevel: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  sleepQuality: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
})

// --- 타입별 스키마 매핑 ---

const dataSchemaMap = {
  BODY_MEASURE: bodyMeasureSchema,
  VITAL_SIGN: vitalSignSchema,
  ACTIVITY: activitySchema,
  MEDICATION: medicationSchema,
  NUTRITION: nutritionSchema,
  SYMPTOM: symptomSchema,
  MENTAL: mentalSchema,
} as const

export type HealthRecordType = keyof typeof dataSchemaMap

// --- 건강 기록 생성 스키마 ---

export const healthRecordCreateSchema = z.object({
  type: z.enum([
    'BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION',
    'NUTRITION', 'SYMPTOM', 'MENTAL',
  ]),
  data: z.unknown(),
  recordedAt: z.string().datetime(),
}).superRefine((val, ctx) => {
  const schema = dataSchemaMap[val.type]
  const result = schema.safeParse(val.data)
  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({
        code: 'custom',
        message: issue.message,
        path: ['data', ...issue.path],
      })
    }
  }
})

// --- 타입별 한국어 라벨 ---

export const healthRecordTypeLabels: Record<HealthRecordType, string> = {
  BODY_MEASURE: '신체 측정',
  VITAL_SIGN: '활력 징후',
  ACTIVITY: '활동',
  MEDICATION: '복약',
  NUTRITION: '영양',
  SYMPTOM: '증상',
  MENTAL: '정신 건강',
}
