// AI 프로바이더 정의 및 ~/.env.ai 기반 동적 감지

export interface AiProvider {
  id: string
  name: string
  description: string
  // 이 키가 환경 변수에 있으면 사용 가능
  envKey: string
  // OpenAI 호환 API 엔드포인트
  endpoint: string
  // 기본 모델
  defaultModel: string
  // 사용 가능한 모델 목록
  models: string[]
  // API 키 불필요 (Ollama 등)
  noApiKey?: boolean
  // 커스텀 URL 환경 변수 (Ollama 등)
  urlEnvKey?: string
}

// 지원하는 모든 프로바이더 정의
export const AI_PROVIDERS: AiProvider[] = [
  // --- 자체 호스팅 ---
  {
    id: 'ollama-home',
    name: 'Ollama (Home Server)',
    description: '홈 서버 Ollama (192.168.0.5)',
    envKey: 'OLLAMA_API_URL',
    endpoint: 'http://192.168.0.5:11434/v1/chat/completions',
    defaultModel: 'qwen2.5:7b',
    models: ['qwen2.5:7b', 'qwen2.5:14b', 'llama3.1:8b', 'gemma2:9b'],
    noApiKey: true,
    urlEnvKey: 'OLLAMA_API_URL',
  },
  {
    id: 'ollama-krdn',
    name: 'Ollama (krdn.kr)',
    description: 'ollama.krdn.kr 서버',
    envKey: '_OLLAMA_KRDN', // 항상 사용 가능 (키 불필요)
    endpoint: 'https://ollama.krdn.kr/v1/chat/completions',
    defaultModel: 'qwen2.5:7b',
    models: ['qwen2.5:7b', 'qwen2.5:14b', 'llama3.1:8b', 'gemma2:9b'],
    noApiKey: true,
  },

  // --- 주요 프로바이더 ---
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini 등',
    envKey: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet, Haiku 등',
    envKey: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini Pro, Flash 등',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Chat, Coder',
    envKey: 'DEEPSEEK_API_KEY',
    endpoint: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  },
  {
    id: 'xai',
    name: 'xAI',
    description: 'Grok',
    envKey: 'XAI_API_KEY',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-2-latest',
    models: ['grok-2-latest', 'grok-2-mini'],
  },

  // --- 중국 프로바이더 ---
  {
    id: 'zhipu',
    name: 'Zhipu AI',
    description: 'GLM-4 시리즈',
    envKey: 'ZHIPUAI_API_KEY',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4-plus',
    models: ['glm-4-plus', 'glm-4', 'glm-4-flash'],
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    description: 'Kimi (Moonshot)',
    envKey: 'MOONSHOT_API_KEY',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },

  // --- 호스팅/라우터 ---
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '멀티 프로바이더 라우터',
    envKey: 'OPENROUTER_API_KEY',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
    models: [
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemini-flash-1.5',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o-mini',
    ],
  },
]

// Anthropic은 OpenAI 호환이 아니므로 별도 처리 필요
export function isAnthropicProvider(providerId: string): boolean {
  return providerId === 'anthropic'
}
