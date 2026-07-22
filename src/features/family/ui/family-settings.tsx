'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'

interface FamilyData {
  id: string
  name: string
  inviteCode: string
  members: { id: string; name: string; email: string; role: string; createdAt: string }[]
}

export function FamilySettings() {
  const { data: session } = useSession()
  const [family, setFamily] = useState<FamilyData | null>(null)
  const isAdmin = session?.user?.role === 'ADMIN'

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/family')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setFamily)
      .catch(() => setError('가족 정보를 불러올 수 없습니다'))
  }, [])

  async function regenerateCode() {
    try {
      setError(null)
      const res = await fetch('/api/family', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerateCode' }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (family) setFamily({ ...family, inviteCode: data.inviteCode })
    } catch {
      setError('초대 코드 재생성에 실패했습니다')
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm('정말 이 구성원을 탈퇴시키겠습니까?')) return
    try {
      setError(null)
      const res = await fetch('/api/family', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeMember', memberId }),
      })
      if (!res.ok) throw new Error()
      if (family) setFamily({ ...family, members: family.members.filter(m => m.id !== memberId) })
    } catch {
      setError('구성원 탈퇴 처리에 실패했습니다')
    }
  }

  if (error && !family) return <p className="text-destructive">{error}</p>
  if (!family) return <p>로딩 중...</p>

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Card>
        <CardHeader><CardTitle>가족 정보</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">가족 이름</p>
            <p className="font-medium">{family.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">초대 코드</p>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 px-3 py-1 rounded text-lg font-mono">{family.inviteCode}</code>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={regenerateCode}>재생성</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>가족 구성원 ({family.members.length}명)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {family.members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {member.role === 'ADMIN' ? '관리자' : '구성원'}
                  </Badge>
                  {isAdmin && member.role !== 'ADMIN' && (
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeMember(member.id)}>탈퇴</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
