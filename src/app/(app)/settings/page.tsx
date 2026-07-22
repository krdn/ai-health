import { FamilySettings } from '@/features/family'
import { ProfileForm, AiProviderForm } from '@/features/settings'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">설정</h2>
      <ProfileForm />
      <AiProviderForm />
      <FamilySettings />
    </div>
  )
}
