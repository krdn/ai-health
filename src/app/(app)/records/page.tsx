import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RecordList } from '@/components/health/record-list'

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">건강 기록</h2>
        <Link href="/records/new">
          <Button>새 기록 추가</Button>
        </Link>
      </div>
      <RecordList />
    </div>
  )
}
