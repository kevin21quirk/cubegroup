import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

  try {
    const client = new Anthropic({ apiKey })
    const models = await (client as any).models?.list?.() ?? null

    // Also probe a few models to see which return 200 vs 404
    const probeModels = [
      'claude-opus-4-5',
      'claude-sonnet-4-5',
      'claude-haiku-4-5',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20241022',
    ]
    const results: Record<string, string> = {}
    for (const model of probeModels) {
      try {
        await client.messages.create({
          model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'hi' }],
        })
        results[model] = 'OK'
      } catch (e: any) {
        results[model] = `${e?.status ?? '?'}: ${e?.error?.error?.message ?? e?.message ?? 'error'}`
      }
    }

    return NextResponse.json({ listedModels: models, probeResults: results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
