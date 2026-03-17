import { FamilySettings } from '@/components/family/family-settings'
import { ProfileForm } from '@/components/settings/profile-form'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">설정</h2>
      <ProfileForm />
      <FamilySettings />
    </div>
  )
}
