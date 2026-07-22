'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const action = formData.get('action') as string

    const body: Record<string, string> = {
      action,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    }

    if (action === 'create') {
      body.familyName = formData.get('familyName') as string
    } else {
      body.inviteCode = formData.get('inviteCode') as string
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : '입력을 확인해주세요')
        return
      }
      router.push('/login?registered=true')
    } catch {
      setError('회원가입 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>AI Health에 가입하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">새 가족 만들기</TabsTrigger>
            <TabsTrigger value="join">초대 코드로 합류</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="action" value="create" />
              <div className="space-y-2">
                <Label htmlFor="name-create">이름</Label>
                <Input id="name-create" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-create">이메일</Label>
                <Input id="email-create" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-create">비밀번호</Label>
                <Input id="password-create" name="password" type="password" minLength={8} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familyName">가족 이름</Label>
                <Input id="familyName" name="familyName" placeholder="예: 홍씨 가족" required />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '처리 중...' : '가족 만들고 가입하기'}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="join">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="action" value="join" />
              <div className="space-y-2">
                <Label htmlFor="name-join">이름</Label>
                <Input id="name-join" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-join">이메일</Label>
                <Input id="email-join" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-join">비밀번호</Label>
                <Input id="password-join" name="password" type="password" minLength={8} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">초대 코드</Label>
                <Input id="inviteCode" name="inviteCode" maxLength={8} placeholder="8자리 코드" required />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '처리 중...' : '가족에 합류하기'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <a href="/login" className="text-blue-600 hover:underline">로그인</a>
        </p>
      </CardContent>
    </Card>
  )
}
