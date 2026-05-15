import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PLAN_LIMITS: Record<string, number> = {
  free: 0, pro: 20, business: 60, enterprise: 999,
}

function channelPrompt(ch: Record<string, string>, ctx: Record<string, string>): string {
  return `Eres media planner senior. Rellena los valores óptimos para este canal.
PROYECTO: Sector:${ctx.sector} Modelo:${ctx.mode} Fase:${ctx.phase} Presupuesto:€${ctx.budget} Clientes objetivo:${ctx.clients} Ticket:€${ctx.ticket}
CANAL: ${ch.name} (${ch.phase}) — Inversión sugerida: €${ch.suggestedInv}
Campos: ${ch.fields}
Usa benchmarks reales. Para B2B: lead2mql 20-40%, mql2sql 40-60%, demo2client 15-30%. Para B2C: carrito2venta 25-45%.
Devuelve SOLO JSON con números. Ejemplo: {"inv":1500,"cpm":8,"ctr":1.5}`
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const meta = user.user_metadata || {}
    const userPlan = ((meta.plan as string) || 'free').toLowerCase()
    const usedAnalisis = Number(meta.used_analisis || 0)
    const maxAnalisis = PLAN_LIMITS[userPlan] ?? 0

    const { channels, context } = await req.json() as {
      channels: Record<string, string>[],
      context: Record<string, string>
    }
    if (!channels?.length) return NextResponse.json({ error: 'Sin canales' }, { status: 400 })

    const needed = channels.length
    const remaining = maxAnalisis - usedAnalisis
    if (remaining < needed) {
      return NextResponse.json({ error: 'credits_insufficient', needed, remaining, plan: userPlan }, { status: 402 })
    }

    const results: Record<string, Record<string, number>> = {}
    for (const ch of channels) {
      try {
        const msg = await ai.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 300,
          messages: [{ role: 'user', content: channelPrompt(ch, context) }],
        })
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
        results[ch.channelId] = JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim())
      } catch {
        results[ch.channelId] = { inv: Number(ch.suggestedInv) || 500 }
      }
    }

    // Update credits
    await supabase.auth.updateUser({ data: { used_analisis: usedAnalisis + needed } })

    return NextResponse.json({
      success: true,
      results,
      used: usedAnalisis + needed,
      remaining: maxAnalisis - usedAnalisis - needed,
      plan: userPlan,
    })
  } catch (err) {
    console.error('ai-tactical:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
