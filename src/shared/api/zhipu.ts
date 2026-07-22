// AI 채팅 클라이언트 - 사용자 선택 프로바이더 또는 환경 변수 기반 폴백

import { AI_PROVIDERS, isAnthropicProvider, type AiProvider } from '@/shared/config/ai-providers'
import { readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  choices: { message: { content: string } }[]
}

// Anthropic API 응답 형식
interface AnthropicResponse {
  content: { type: string; text: string }[]
}

// ~/.env.ai 파일에서 API 키 로드
function loadEnvAiKeys(): Record<string, string> {
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

// 프로바이더 설정 해석: "providerId:model" 형식 (모델명에 ':'이 포함될 수 있음)
function parseProviderSetting(setting: string): { providerId: string; model?: string } {
  const idx = setting.indexOf(':')
  if (idx === -1) return { providerId: setting }
  const providerId = setting.slice(0, idx)
  const model = setting.slice(idx + 1)
  return { providerId, model: model || undefined }
}

// 환경 변수 기반 폴백 설정 (기존 로직 호환)
function getFallbackConfig(): { provider: AiProvider; model: string; apiKey: string } {
  const envKeys = loadEnvAiKeys()

  // 환경 변수 우선순위: OLLAMA > DEEPSEEK > ZHIPU
  const ollamaUrl = process.env.OLLAMA_API_URL
  if (ollamaUrl) {
    const provider = AI_PROVIDERS.find((p) => p.id === 'ollama-home')!
    return {
      provider: { ...provider, endpoint: `${ollamaUrl.replace(/\/$/, '')}/v1/chat/completions` },
      model: process.env.OLLAMA_MODEL || provider.defaultModel,
      apiKey: '',
    }
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY || envKeys['DEEPSEEK_API_KEY']
  if (deepseekKey) {
    const provider = AI_PROVIDERS.find((p) => p.id === 'deepseek')!
    return { provider, model: provider.defaultModel, apiKey: deepseekKey }
  }

  const zhipuKey = process.env.ZHIPU_API_KEY || envKeys['ZHIPUAI_API_KEY']
  if (zhipuKey) {
    const provider = AI_PROVIDERS.find((p) => p.id === 'zhipu')!
    return { provider, model: provider.defaultModel, apiKey: zhipuKey }
  }

  throw new Error('AI API가 설정되지 않았습니다. 설정 페이지에서 AI 모델을 선택하거나 환경 변수를 설정하세요.')
}

// 사용자 선택 프로바이더 기반 설정
function getProviderConfig(providerSetting: string): { provider: AiProvider; model: string; apiKey: string } {
  const { providerId, model } = parseProviderSetting(providerSetting)
  const provider = AI_PROVIDERS.find((p) => p.id === providerId)
  if (!provider) {
    return getFallbackConfig()
  }

  const envKeys = loadEnvAiKeys()
  const apiKey = provider.noApiKey ? '' : (envKeys[provider.envKey] || process.env[provider.envKey] || '')

  if (!provider.noApiKey && !apiKey) {
    // 키가 없으면 폴백
    return getFallbackConfig()
  }

  return {
    provider,
    model: model || provider.defaultModel,
    apiKey,
  }
}

const KOREAN_INSTRUCTION = '반드시 한국어로 응답하세요. 모든 설명, 분석, 판단 근거를 한국어로 작성하세요.'

// Anthropic API 호출 (OpenAI 호환이 아닌 별도 형식)
async function callAnthropic(
  messages: ChatMessage[],
  model: string,
  apiKey: string
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system')
  const nonSystemMsgs = messages.filter((m) => m.role !== 'system')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: systemMsg ? `${systemMsg.content}\n\n${KOREAN_INSTRUCTION}` : KOREAN_INSTRUCTION,
      messages: nonSystemMsgs.map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Anthropic API 오류: ${res.status} ${error}`)
  }

  const data = (await res.json()) as AnthropicResponse
  return data.content[0].text
}

// OpenAI 호환 API 호출
async function callOpenAICompatible(
  messages: ChatMessage[],
  endpoint: string,
  model: string,
  apiKey: string,
  providerName: string
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`${providerName} API 오류: ${res.status} ${error}`)
  }

  const data = (await res.json()) as ChatResponse
  return data.choices[0].message.content
}

/**
 * AI 채팅 호출
 * @param messages - 채팅 메시지 배열
 * @param providerSetting - "providerId:model" 형식 (선택). 없으면 환경 변수 폴백
 */
export async function chatWithZhipu(
  messages: ChatMessage[],
  providerSetting?: string | null
): Promise<string> {
  const config = providerSetting
    ? getProviderConfig(providerSetting)
    : getFallbackConfig()

  // system 메시지에 한국어 지시 주입
  const processedMessages = messages.map((msg) => {
    if (msg.role === 'system') {
      return { ...msg, content: `${msg.content}\n\n${KOREAN_INSTRUCTION}` }
    }
    return msg
  })

  // Anthropic는 별도 API 형식
  if (isAnthropicProvider(config.provider.id)) {
    return callAnthropic(messages, config.model, config.apiKey)
  }

  return callOpenAICompatible(
    processedMessages,
    config.provider.endpoint,
    config.model,
    config.apiKey,
    config.provider.name
  )
}

export const DISCLAIMER =
  '\n\n---\n⚠️ 본 분석은 참고용이며 의학적 진단이나 처방을 대체하지 않습니다. 약물 변경이나 건강 관련 결정은 반드시 의료 전문가와 상담하세요.'
