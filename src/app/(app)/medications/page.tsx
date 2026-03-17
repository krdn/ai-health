'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MedicationForm } from '@/components/medications/medication-form'
import { MedicationList } from '@/components/medications/medication-list'

export default function MedicationsPage() {
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = () => {
    setShowForm(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">복용약/건강보조제</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? '취소' : '추가'}
        </Button>
      </div>

      {showForm && <MedicationForm onSuccess={handleSuccess} />}

      <MedicationList refreshKey={refreshKey} />
    </div>
  )
}
