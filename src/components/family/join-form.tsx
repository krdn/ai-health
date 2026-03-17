'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function JoinFamilyForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const inviteCode = formData.get('inviteCode') as string

    try {
      const res = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '합류에 실패했습니다')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>가족 합류</CardTitle>
        <CardDescription>초대 코드를 입력하여 가족에 합류하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">초대 코드</Label>
            <Input id="inviteCode" name="inviteCode" maxLength={8} placeholder="8자리 코드" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '처리 중...' : '합류하기'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
