import { CheckupUpload } from '@/features/checkup'
import { CheckupList } from '@/features/checkup'

export default function CheckupPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">건강검진</h2>
      <CheckupUpload />
      <CheckupList />
    </div>
  )
}
