import { NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { AI_PROVIDERS } from '@/shared/config/ai-providers'
import { readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// ~/.env.ai 파일에서 설정된 키 파싱
function parseEnvAiFile(): Record<string, string> {
  try {
    const envPath = join(homedir(), '.env.ai')
    const content = readFileSync(envPath, 'utf-8')
    const vars: Record<string, string> = {}

    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      if (value) vars[key] = value
    }

    return vars
  } catch {
    return {}
  }
}

// GET /api/ai-providers - 사용 가능한 AI 프로바이더 목록
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const envVars = parseEnvAiFile()

    const providers = AI_PROVIDERS.map((provider) => {
      // Ollama 계열: 키 불필요 → 항상 사용 가능
      // 일반 프로바이더: ~/.env.ai에 키가 설정되어 있어야 사용 가능
      const available = provider.noApiKey || !!envVars[provider.envKey]

      return {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        defaultModel: provider.defaultModel,
        models: provider.models,
        available,
      }
    }).filter((p) => p.available)

    return NextResponse.json({ providers })
  } catch {
    return NextResponse.json(
      { error: '프로바이더 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
