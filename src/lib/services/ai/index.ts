import { AIProvider } from '@/types'
import { OpenAIProvider } from './openai-provider'
import { BedrockProvider } from './bedrock-provider'

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'openai'
  
  switch (provider) {
    case 'bedrock':
      return new BedrockProvider()
    case 'openai':
    default:
      return new OpenAIProvider()
  }
}

export { BaseAIProvider } from './ai-provider'
export { OpenAIProvider } from './openai-provider'
export { BedrockProvider } from './bedrock-provider'
