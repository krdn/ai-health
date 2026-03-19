const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

interface ZhipuMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ZhipuResponse {
  choices: { message: { content: string } }[]
}

export async function chatWithZhipu(messages: ZhipuMessage[]): Promise<string> {
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) throw new Error('ZHIPU_API_KEY 환경 변수가 설정되지 않았습니다')

  const res = await fetch(ZHIPU_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'glm-4-plus',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Zhipu AI API 오류: ${res.status} ${error}`)
  }

  const data = (await res.json()) as ZhipuResponse
  return data.choices[0].message.content
}

export const DISCLAIMER =
  '\n\n---\n⚠️ 본 분석은 참고용이며 의학적 진단이나 처방을 대체하지 않습니다. 약물 변경이나 건강 관련 결정은 반드시 의료 전문가와 상담하세요.'
