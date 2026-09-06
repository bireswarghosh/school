export type AiProvider = {
  id: string
  name: string
  model: string
  url: string
  keyHint: string
  free: boolean
  needsKey?: boolean
  special?: "gemini" | "openrouter"
  signup: string
}

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: "gemini",
    name: "Google Gemini 3.6 Flash",
    model: "gemini-3.6-flash",
    url: "https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent",
    keyHint: "AIza...",
    free: true,
    special: "gemini",
    signup: "https://aistudio.google.com/apikey",
  },
  {
    id: "groq",
    name: "Groq (Qwen 3.8)",
    model: "qwen/qwen3.8-27b",
    url: "https://api.groq.com/openai/v1/chat/completions",
    keyHint: "gsk_...",
    free: true,
    signup: "https://console.groq.com/keys",
  },
  {
    id: "openrouter",
    name: "OpenRouter (Free models)",
    model: "openai/gpt-4o-mini",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyHint: "sk-or-...",
    free: true,
    special: "openrouter",
    signup: "https://openrouter.ai/keys",
  },
  {
    id: "sambanova",
    name: "SambaNova (Llama 3.3)",
    model: "Meta-Llama-3.3-70B-Instruct",
    url: "https://api.sambanova.ai/v1/chat/completions",
    keyHint: "sk-...",
    free: true,
    signup: "https://cloud.sambanova.ai/apis",
  },
  {
    id: "huggingface",
    name: "Hugging Face Inference",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    url: "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.3-70B-Instruct/v1/chat/completions",
    keyHint: "hf_...",
    free: true,
    signup: "https://huggingface.co/settings/tokens",
  },
  {
    id: "cerebras",
    name: "Cerebras (Llama 3.3)",
    model: "llama-3.3-70b",
    url: "https://api.cerebras.ai/v1/chat/completions",
    keyHint: "csk-...",
    free: true,
    signup: "https://cloud.cerebras.ai/platform/api-keys",
  },
  {
    id: "ollama",
    name: "Ollama (Local - No Key)",
    model: "llama3.1",
    url: "http://localhost:11434/v1/chat/completions",
    keyHint: "No key needed - runs locally",
    free: true,
    needsKey: false,
    signup: "https://ollama.com/download",
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM (Llama 3.1)",
    model: "meta/llama-3.1-8b-instruct",
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    keyHint: "nvapi-...",
    free: true,
    signup: "https://build.nvidia.com",
  },
  {
    id: "together",
    name: "Together AI (Llama 3.3)",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    url: "https://api.together.xyz/v1/chat/completions",
    keyHint: "tgp_v1_...",
    free: true,
    signup: "https://api.together.ai/settings/api-keys",
  },
  {
    id: "deepseek",
    name: "DeepSeek V3",
    model: "deepseek-chat",
    url: "https://api.deepseek.com/v1/chat/completions",
    keyHint: "sk-...",
    free: false,
    signup: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    model: "mistral-small-latest",
    url: "https://api.mistral.ai/v1/chat/completions",
    keyHint: "...",
    free: true,
    signup: "https://console.mistral.ai/api-keys",
  },
  {
    id: "openai",
    name: "OpenAI GPT-4o-mini",
    model: "gpt-4o-mini",
    url: "https://api.openai.com/v1/chat/completions",
    keyHint: "sk-...",
    free: false,
    signup: "https://platform.openai.com/api-keys",
  },
]

export const AI_KEY_MAP: Record<string, string> = Object.fromEntries(
  AI_PROVIDERS.map((p) => [p.id, `ai_key_${p.id}`])
)

export function providerById(id: string | null | undefined): AiProvider {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0]
}