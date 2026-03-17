import { CheckupUpload } from '@/components/checkup/checkup-upload'
import { CheckupList } from '@/components/checkup/checkup-list'

export default function CheckupPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">건강검진</h2>
      <CheckupUpload />
      <CheckupList />
    </div>
  )
}
