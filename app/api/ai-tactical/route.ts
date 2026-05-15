import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PLAN_LIMITS: Record<string, number> = {
  free: 0, pro: 20, business: 60, enterprise: 999,
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Build per-channel AI prompt
function channelPrompt(ch: Record<string, string>, ctx: Record<string, string>): string {
  return `Eres un media planner senior experto. Rellena los valores óptimos para este canal de marketing.

CONTEXTO DEL PROYECTO:
- Sector: ${ctx.sector} | Modelo: ${ctx.mode} | Fase: ${ctx.phase}
- Presupuesto anual: €${ctx.budget}
- Objetivo clientes: ${ctx.clients} | Ticket medio: €${ctx.ticket}
- Objetivos: ${ctx.objetivos}

CANAL A RELLENAR:
- Canal: ${ch.name} (fase: ${ch.phase}, tipo: ${ch.kt})
- Campos a rellenar: ${ch.fields}
- Presupuesto sugerido para este canal: €${ch.suggestedInv}

INSTRUCCIONES:
- Usa benchmarks reales del sector ${ctx.sector} para ${ctx.mode}
- La inversión (inv) debe ser €${ch.suggestedInv} o cercana
- Los ratios (CR, CTR, CPM, etc.) deben ser conservadores pero realistas para ${ctx.phase}
- Para canales B2B incluye lead2mql (20-40%), mql2sql (40-60%), demo2client (15-30%)
- Para canales B2C incluye carrito2venta (25-45%)

Devuelve SOLO JSON con los valores numéricos de cada campo, sin texto extra:
{ "inv": 0, ${ch.fieldKeys} }`
}

export async function POST(req: NextRequest) {
  try {
    // Auth via Bearer token
    const auth = req.headers.get('authorization')
    const token = auth?.replace('Bearer ', '').trim()
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const supabase = serviceClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

    const userPlan = (user.user_metadata?.plan || 'free').toLowerCase()
    const usedAnalisis = Number(user.user_metadata?.used_analisis || 0)
    const maxAnalisis = PLAN_LIMITS[userPlan] ?? 0

    const { channels, context } = await req.json()
    if (!channels?.length) return NextResponse.json({ error: 'Sin canales' }, { status: 400 })

    const needed = channels.length
    const remaining = maxAnalisis - usedAnalisis

    if (remaining < needed) {
      return NextResponse.json({
        error: 'credits_insufficient',
        needed,
        remaining,
        plan: userPlan,
      }, { status: 402 })
    }

    // Process each channel with AI
    const results: Record<string, Record<string, number>> = {}
    for (const ch of channels) {
      try {
        const prompt = channelPrompt(ch, context)
        const msg = await ai.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        })
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        results[ch.channelId] = JSON.parse(clean)
      } catch {
        results[ch.channelId] = { inv: parseFloat(ch.suggestedInv) || 500 }
      }
    }

    // Deduct credits
    const newUsed = usedAnalisis + needed
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, used_analisis: newUsed }
    })

    return NextResponse.json({
      success: true,
      results,
      used: newUsed,
      remaining: maxAnalisis - newUsed,
      plan: userPlan,
    })
  } catch (err) {
    console.error('ai-tactical error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
