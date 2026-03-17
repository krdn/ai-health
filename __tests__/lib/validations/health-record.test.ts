import { describe, it, expect } from 'vitest'
import {
  bodyMeasureSchema,
  vitalSignSchema,
  activitySchema,
  medicationSchema,
  nutritionSchema,
  symptomSchema,
  mentalSchema,
  healthRecordCreateSchema,
  healthRecordTypeLabels,
} from '@/lib/validations/health-record'

describe('bodyMeasureSchema', () => {
  it('유효한 데이터를 통과시킨다', () => {
    expect(() => bodyMeasureSchema.parse({ weight: 70, height: 175, bodyFat: 20 })).not.toThrow()
    expect(() => bodyMeasureSchema.parse({ weight: 70 })).not.toThrow()
    expect(() => bodyMeasureSchema.parse({})).not.toThrow()
  })

  it('범위를 벗어난 값을 거부한다', () => {
    expect(() => bodyMeasureSchema.parse({ weight: 0 })).toThrow()
    expect(() => bodyMeasureSchema.parse({ weight: 301 })).toThrow()
    expect(() => bodyMeasureSchema.parse({ height: 29 })).toThrow()
    expect(() => bodyMeasureSchema.parse({ height: 251 })).toThrow()
    expect(() => bodyMeasureSchema.parse({ bodyFat: 0 })).toThrow()
    expect(() => bodyMeasureSchema.parse({ bodyFat: 61 })).toThrow()
  })
})

describe('vitalSignSchema', () => {
  it('유효한 데이터를 통과시킨다', () => {
    expect(() => vitalSignSchema.parse({
      systolic: 120, diastolic: 80, heartRate: 72,
      bloodSugar: 100, temperature: 36.5,
    })).not.toThrow()
    expect(() => vitalSignSchema.parse({})).not.toThrow()
  })

  it('범위를 벗어난 값을 거부한다', () => {
    expect(() => vitalSignSchema.parse({ systolic: 59 })).toThrow()
    expect(() => vitalSignSchema.parse({ systolic: 251 })).toThrow()
    expect(() => vitalSignSchema.parse({ diastolic: 29 })).toThrow()
    expect(() => vitalSignSchema.parse({ diastolic: 151 })).toThrow()
    expect(() => vitalSignSchema.parse({ heartRate: 29 })).toThrow()
    expect(() => vitalSignSchema.parse({ heartRate: 221 })).toThrow()
    expect(() => vitalSignSchema.parse({ bloodSugar: 19 })).toThrow()
    expect(() => vitalSignSchema.parse({ bloodSugar: 601 })).toThrow()
    expect(() => vitalSignSchema.parse({ temperature: 33.9 })).toThrow()
    expect(() => vitalSignSchema.parse({ temperature: 42.1 })).toThrow()
  })
})

describe('activitySchema', () => {
  it('유효한 데이터를 통과시킨다', () => {
    expect(() => activitySchema.parse({
      steps: 10000, sleepHours: 8, exercise: '달리기',
      duration: 60, intensity: 'MODERATE',
      heartRateAvg: 130, heartRateMax: 170,
      caloriesBurned: 500, rpe: 7,
    })).not.toThrow()
    expect(() => activitySchema.parse({})).not.toThrow()
  })

  it('범위를 벗어난 값을 거부한다', () => {
    expect(() => activitySchema.parse({ steps: -1 })).toThrow()
    expect(() => activitySchema.parse({ steps: 100001 })).toThrow()
    expect(() => activitySchema.parse({ sleepHours: -1 })).toThrow()
    expect(() => activitySchema.parse({ sleepHours: 25 })).toThrow()
    expect(() => activitySchema.parse({ exercise: 'a'.repeat(51) })).toThrow()
    expect(() => activitySchema.parse({ duration: -1 })).toThrow()
    expect(() => activitySchema.parse({ duration: 1441 })).toThrow()
    expect(() => activitySchema.parse({ intensity: 'INVALID' })).toThrow()
    expect(() => activitySchema.parse({ rpe: 0 })).toThrow()
    expect(() => activitySchema.parse({ rpe: 11 })).toThrow()
  })
})

describe('medicationSchema', () => {
  it('유효한 데이터를 통과시킨다', () => {
    expect(() => medicationSchema.parse({
      name: '타이레놀', category: 'OTC',
      dosage: '500mg', frequency: '하루 3회',
    })).not.toThrow()
  })

  it('필수 필드 누락 시 거부한다', () => {
    expect(() => medicationSchema.parse({})).toThrow()
    expect(() => medicationSchema.parse({ name: '타이레놀' })).toThrow()
    expect(() => medicationSchema.parse({ category: 'OTC' })).toThrow()
  })

  it('잘못된 카테고리를 거부한다', () => {
    expect(() => medicationSchema.parse({ name: '약', category: 'INVALID' })).toThrow()
  })
})

describe('nutritionSchema', () => {
  it('유효한 데이터를 통과시킨다', () => {
    expect(() => nutritionSchema.parse({
      meal: 'LUNCH', description: '비빔밥',
      calories: 600, protein: 20, carbs: 80, fat: 15,
    })).not.toThrow()
  })

  it('필수 필드 누락 시 거부한다', () => {
    expect(() => nutritionSchema.parse({})).toThrow()
  })

  it('범위를 벗어난 값을 거부한다', () => {
    expect(() => nutritionSchema.parse({ meal: 'LUNCH', calories: -1 })).toThrow()
    expect(() => nutritionSchema.parse({ meal: 'LUNCH', calories: 5001 })).toThrow()
    expect(() => nutritionSchema.parse({ meal: 'INVALID' })).toThrow()
  })
})

describe('symptomSchema', () => {
  it('유효한 데이터를 통과시킨다', () => {
    expect(() => symptomSchema.parse({
      symptom: '두통', severity: 5,
      location: '이마', duration: 120, trigger: '스트레스',
    })).not.toThrow()
  })

  it('필수 필드 누락 시 거부한다', () => {
    expect(() => symptomSchema.parse({})).toThrow()
    expect(() => symptomSchema.parse({ symptom: '두통' })).toThrow()
    expect(() => symptomSchema.parse({ severity: 5 })).toThrow()
  })

  it('범위를 벗어난 값을 거부한다', () => {
    expect(() => symptomSchema.parse({ symptom: '두통', severity: 0 })).toThrow()
    expect(() => symptomSchema.parse({ symptom: '두통', severity: 11 })).toThrow()
    expect(() => symptomSchema.parse({ symptom: '두통', severity: 5, duration: -1 })).toThrow()
    expect(() => symptomSchema.parse({ symptom: '두통', severity: 5, duration: 10081 })).toThrow()
  })
})

describe('mentalSchema', () => {
  it('유효한 데이터를 통과시킨다', () => {
    expect(() => mentalSchema.parse({
      mood: 7, stressLevel: 3, anxietyLevel: 2,
      energyLevel: 8, sleepQuality: 9, notes: '좋은 하루',
    })).not.toThrow()
    expect(() => mentalSchema.parse({})).not.toThrow()
  })

  it('범위를 벗어난 값을 거부한다', () => {
    expect(() => mentalSchema.parse({ mood: 0 })).toThrow()
    expect(() => mentalSchema.parse({ mood: 11 })).toThrow()
    expect(() => mentalSchema.parse({ stressLevel: 0 })).toThrow()
    expect(() => mentalSchema.parse({ stressLevel: 11 })).toThrow()
    expect(() => mentalSchema.parse({ anxietyLevel: 0 })).toThrow()
    expect(() => mentalSchema.parse({ anxietyLevel: 11 })).toThrow()
    expect(() => mentalSchema.parse({ energyLevel: 0 })).toThrow()
    expect(() => mentalSchema.parse({ energyLevel: 11 })).toThrow()
    expect(() => mentalSchema.parse({ sleepQuality: 0 })).toThrow()
    expect(() => mentalSchema.parse({ sleepQuality: 11 })).toThrow()
  })
})

describe('healthRecordCreateSchema', () => {
  it('type과 data 조합이 올바르면 통과시킨다', () => {
    expect(() => healthRecordCreateSchema.parse({
      type: 'BODY_MEASURE',
      data: { weight: 70 },
      recordedAt: '2026-03-17T09:00:00.000Z',
    })).not.toThrow()

    expect(() => healthRecordCreateSchema.parse({
      type: 'VITAL_SIGN',
      data: { systolic: 120, diastolic: 80 },
      recordedAt: '2026-03-17T09:00:00.000Z',
    })).not.toThrow()

    expect(() => healthRecordCreateSchema.parse({
      type: 'SYMPTOM',
      data: { symptom: '두통', severity: 5 },
      recordedAt: '2026-03-17T09:00:00.000Z',
    })).not.toThrow()
  })

  it('type과 data가 일치하지 않으면 거부한다', () => {
    expect(() => healthRecordCreateSchema.parse({
      type: 'BODY_MEASURE',
      data: { weight: 999 },
      recordedAt: '2026-03-17T09:00:00.000Z',
    })).toThrow()
  })

  it('type이 없으면 거부한다', () => {
    expect(() => healthRecordCreateSchema.parse({
      data: { weight: 70 },
      recordedAt: '2026-03-17T09:00:00.000Z',
    })).toThrow()
  })

  it('recordedAt가 없으면 거부한다', () => {
    expect(() => healthRecordCreateSchema.parse({
      type: 'BODY_MEASURE',
      data: { weight: 70 },
    })).toThrow()
  })
})

describe('healthRecordTypeLabels', () => {
  it('모든 타입에 한국어 라벨이 있다', () => {
    const types = [
      'BODY_MEASURE', 'VITAL_SIGN', 'ACTIVITY', 'MEDICATION',
      'NUTRITION', 'SYMPTOM', 'MENTAL',
    ] as const
    for (const type of types) {
      expect(healthRecordTypeLabels[type]).toBeDefined()
      expect(typeof healthRecordTypeLabels[type]).toBe('string')
    }
  })
})
