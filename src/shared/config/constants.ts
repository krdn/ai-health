// AI 분석 일일 요청 제한 (가족 단위)
export const DAILY_LIMIT = 10

// KST(UTC+9) 기준 오늘 자정 반환
export function getTodayStartKST(): Date {
  const now = new Date()
  // KST 오프셋 적용하여 현지 날짜 계산
  const kstOffset = 9 * 60 * 60 * 1000
  const kstNow = new Date(now.getTime() + kstOffset)
  const dateStr = kstNow.toISOString().slice(0, 10)
  // KST 자정을 UTC로 변환
  return new Date(`${dateStr}T00:00:00+09:00`)
}
