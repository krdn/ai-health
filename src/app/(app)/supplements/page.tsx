'use client'

import { useState } from 'react'
import { SupplementAddForm, SupplementCatalogList } from '@/features/supplements'

export default function SupplementsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">가족 약품/보조제 관리</h2>
        <p className="text-muted-foreground">
          가족이 공통으로 사용하는 약품과 보조제를 등록하고, AI가 성분을 분석하여 각 구성원에게 적합한지 확인합니다.
        </p>
      </div>

      <SupplementAddForm onSuccess={() => setRefreshKey((k) => k + 1)} />

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">등록된 약품 목록</h3>
        <SupplementCatalogList refreshKey={refreshKey} />
      </section>
    </div>
  )
}
