import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">대시보드</h2>
      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {session?.user?.name}님!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">건강 데이터를 기록하고 AI 분석을 받아보세요.</p>
        </CardContent>
      </Card>
    </div>
  )
}
