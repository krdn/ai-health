'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

interface ProfileData {
  birthDate: string | null
  birthTime: string | null
  birthCalendarType: string | null
  gender: string | null
}

export function ProfileForm() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthCalendarType, setBirthCalendarType] = useState('SOLAR')
  const [gender, setGender] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        const user = data.user
        setProfile(user)
        if (user.birthDate) {
          setBirthDate(new Date(user.birthDate).toISOString().slice(0, 10))
        }
        if (user.birthTime) setBirthTime(user.birthTime)
        if (user.birthCalendarType) setBirthCalendarType(user.birthCalendarType)
        if (user.gender) setGender(user.gender)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: birthDate || null,
          birthTime: birthTime || null,
          birthCalendarType,
          gender: gender || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? '저장 중 오류가 발생했습니다.')
        return
      }

      setMessage('프로필이 저장되었습니다.')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <p className="text-gray-500">로딩 중...</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>프로필 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 생년월일 */}
        <div className="space-y-1.5">
          <Label htmlFor="birth-date">생년월일</Label>
          <Input
            id="birth-date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            disabled={saving}
          />
        </div>

        {/* 출생 시간 */}
        <div className="space-y-1.5">
          <Label htmlFor="birth-time">출생 시간 (선택)</Label>
          <Input
            id="birth-time"
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            disabled={saving}
          />
          <p className="text-xs text-gray-500">모르는 경우 비워두세요. 사주 분석 시 정오(12시)로 가정합니다.</p>
        </div>

        {/* 달력 유형 */}
        <div className="space-y-1.5">
          <Label htmlFor="calendar-type">달력 유형</Label>
          <select
            id="calendar-type"
            value={birthCalendarType}
            onChange={(e) => setBirthCalendarType(e.target.value)}
            disabled={saving}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <option value="SOLAR">양력</option>
            <option value="LUNAR">음력</option>
          </select>
        </div>

        {/* 성별 */}
        <div className="space-y-1.5">
          <Label htmlFor="gender">성별 (선택)</Label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            disabled={saving}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <option value="">선택 안 함</option>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
          </select>
        </div>

        {/* 저장 버튼 */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? '저장 중...' : '저장'}
        </Button>

        {/* 메시지 */}
        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
