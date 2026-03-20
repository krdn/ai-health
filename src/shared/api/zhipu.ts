// AI 채팅 클라이언트 - Ollama / Zhipu / DeepSeek 등 OpenAI 호환 API 지원

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  choices: { message: { content: string } }[]
}

// 환경 변수 기반 설정 (우선순위: OLLAMA > DEEPSEEK > ZHIPU)
function getConfig() {
  const ollamaUrl = process.env.OLLAMA_API_URL
  if (ollamaUrl) {
    return {
      url: `${ollamaUrl.replace(/\/$/, '')}/v1/chat/completions`,
      model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      apiKey: '', // Ollama는 키 불필요
      name: 'Ollama',
    }
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY
  if (deepseekKey) {
    return {
      url: 'https://api.deepseek.com/chat/completions',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      apiKey: deepseekKey,
      name: 'DeepSeek',
    }
  }

  const zhipuKey = process.env.ZHIPU_API_KEY
  if (zhipuKey) {
    return {
      url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4-plus',
      apiKey: zhipuKey,
      name: 'Zhipu',
    }
  }

  throw new Error('AI API가 설정되지 않았습니다. OLLAMA_API_URL, DEEPSEEK_API_KEY, 또는 ZHIPU_API_KEY를 설정하세요.')
}

const KOREAN_INSTRUCTION = '반드시 한국어로 응답하세요. 모든 설명, 분석, 판단 근거를 한국어로 작성하세요.'

export async function chatWithZhipu(messages: ChatMessage[]): Promise<string> {
  const config = getConfig()

  // system 메시지에 한국어 지시 주입
  const processedMessages = messages.map((msg) => {
    if (msg.role === 'system') {
      return { ...msg, content: `${msg.content}\n\n${KOREAN_INSTRUCTION}` }
    }
    return msg
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  const res = await fetch(config.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: processedMessages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`${config.name} API 오류: ${res.status} ${error}`)
  }

  const data = (await res.json()) as ChatResponse
  return data.choices[0].message.content
}

export const DISCLAIMER =
  '\n\n---\n⚠️ 본 분석은 참고용이며 의학적 진단이나 처방을 대체하지 않습니다. 약물 변경이나 건강 관련 결정은 반드시 의료 전문가와 상담하세요.'
