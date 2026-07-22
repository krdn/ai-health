export interface SeasonalInfo {
  season: string
  icon: string
  color: string
  tips: string[]
}

export function getSeasonalInfo(): SeasonalInfo {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) {
    return {
      season: '봄',
      icon: '🌸',
      color: 'bg-pink-50 border-pink-200',
      tips: [
        '환절기 면역력 강화를 위해 비타민C 섭취를 늘리세요',
        '꽃가루 알레르기 주의: 외출 후 손씻기와 세안을 철저히',
        '야외 활동 증가 시기 - 자외선 차단제 사용을 시작하세요',
        '봄 나물(냉이, 달래, 쑥)로 제철 영양소를 보충하세요',
      ],
    }
  } else if (month >= 6 && month <= 8) {
    return {
      season: '여름',
      icon: '☀️',
      color: 'bg-amber-50 border-amber-200',
      tips: [
        '탈수 예방: 하루 2L 이상 수분 섭취를 목표로 하세요',
        '식중독 예방: 음식 보관과 조리 시 위생에 주의하세요',
        '냉방병 주의: 실내외 온도 차이를 5도 이내로 유지하세요',
        '무더위 운동은 아침 일찍 또는 저녁에 하세요',
      ],
    }
  } else if (month >= 9 && month <= 11) {
    return {
      season: '가을',
      icon: '🍂',
      color: 'bg-orange-50 border-orange-200',
      tips: [
        '독감 예방접종 적기입니다 (10~11월 권장)',
        '건조한 날씨에 수분 섭취와 보습에 신경 쓰세요',
        '일교차가 큰 시기 - 겉옷을 준비하세요',
        '제철 과일(배, 감, 사과)로 면역력을 높이세요',
      ],
    }
  } else {
    return {
      season: '겨울',
      icon: '❄️',
      color: 'bg-blue-50 border-blue-200',
      tips: [
        '한랭질환 주의: 외출 시 보온에 신경 쓰세요',
        '비타민D 부족 주의: 보충제 섭취를 고려하세요',
        '혈압이 올라가기 쉬운 계절 - 정기적으로 측정하세요',
        '실내 습도 40~60% 유지로 호흡기 건강을 지키세요',
      ],
    }
  }
}
