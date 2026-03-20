'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

interface AvailableProvider {
  id: string
  name: string
  description: string
  defaultModel: string
  models: string[]
  available: boolean
}

export function AiProviderForm() {
  const [providers, setProviders] = useState<AvailableProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [currentSetting, setCurrentSetting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 프로바이더 목록과 현재 설정을 병렬 로드
    Promise.all([
      fetch('/api/ai-providers').then((r) => r.json()),
      fetch('/api/profile').then((r) => r.json()),
    ])
      .then(([providerData, profileData]) => {
        setProviders(providerData.providers || [])

        const setting = profileData.user?.preferredAiProvider
        setCurrentSetting(setting || null)

        if (setting) {
          const [providerId, model] = setting.split(':')
          setSelectedProvider(providerId)
          setSelectedModel(model || '')
        }
      })
      .catch(() => setError('데이터를 불러오는 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  // 프로바이더 변경 시 기본 모델 설정
  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId)
    const provider = providers.find((p) => p.id === providerId)
    if (provider) {
      setSelectedModel(provider.defaultModel)
    }
    setMessage(null)
    setError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const providerSetting = selectedProvider
        ? `${selectedProvider}:${selectedModel}`
        : null

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredAiProvider: providerSetting }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? '저장 중 오류가 발생했습니다.')
        return
      }

      setCurrentSetting(providerSetting)
      setMessage('AI 모델 설정이 저장되었습니다.')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredAiProvider: null }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? '초기화 중 오류가 발생했습니다.')
        return
      }

      setSelectedProvider('')
      setSelectedModel('')
      setCurrentSetting(null)
      setMessage('기본 설정(환경 변수 기반)으로 초기화되었습니다.')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-500">로딩 중...</p>

  const currentProvider = providers.find((p) => p.id === selectedProvider)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI 모델 설정
        </CardTitle>
        {currentSetting && (
          <p className="text-sm text-muted-foreground">
            현재: <span className="font-medium text-foreground">{currentSetting}</span>
          </p>
        )}
        {!currentSetting && (
          <p className="text-sm text-muted-foreground">
            현재: 기본 설정 (환경 변수 기반 자동 선택)
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 프로바이더 선택 */}
        <div className="space-y-1.5">
          <Label htmlFor="ai-provider">AI 프로바이더</Label>
          <select
            id="ai-provider"
            value={selectedProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
            disabled={saving}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <option value="">자동 선택 (환경 변수 기반)</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name} — {provider.description}
              </option>
            ))}
          </select>
        </div>

        {/* 모델 선택 */}
        {currentProvider && (
          <div className="space-y-1.5">
            <Label htmlFor="ai-model">모델</Label>
            <select
              id="ai-model"
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value)
                setMessage(null)
              }}
              disabled={saving}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              {currentProvider.models.map((model) => (
                <option key={model} value={model}>
                  {model}{model === currentProvider.defaultModel ? ' (기본)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 사용 가능한 프로바이더 목록 */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            사용 가능한 프로바이더 {providers.length}개 (API 키가 설정된 서비스만 표시)
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
          {currentSetting && (
            <Button
              onClick={handleReset}
              disabled={saving}
              variant="outline"
            >
              초기화
            </Button>
          )}
        </div>

        {/* 메시지 */}
        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
