import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PLAN_LIMITS: Record<string, number> = {
  free: 0, pro: 20, business: 60, enterprise: 999,
}

function svcClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function channelPrompt(ch: Record<string, string>, ctx: Record<string, string>): string {
  return `Eres un media planner senior. Rellena los valores óptimos para este canal.

PROYECTO: Sector: ${ctx.sector} | Modelo: ${ctx.mode} | Fase: ${ctx.phase}
Presupuesto total: €${ctx.budget} | Objetivo clientes: ${ctx.clients} | Ticket: €${ctx.ticket}
Objetivos: ${ctx.objetivos}

CANAL: ${ch.name} (fase: ${ch.phase}, tipo: ${ch.kt})
Campos a completar: ${ch.fields}
Presupuesto sugerido para este canal: €${ch.suggestedInv}

Usa benchmarks reales del sector. Para B2B incluye lead2mql (20-40%), mql2sql (40-60%), demo2client (15-30%). Para B2C incluye carrito2venta (25-45%). La inversión (inv) debe ser ${ch.suggestedInv} aprox.

Devuelve SOLO un JSON con los valores numéricos. Ejemplo: {"inv":1500,"cpm":8,"ctr":1.5}`
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.replace('Bearer ', '').trim()
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const supabase = svcClient()

    // Validate token and get user
    const { data: userData, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !userData?.user) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }
    const user = userData.user
    const meta = user.user_metadata || {}
    const userPlan = ((meta.plan as string) || 'free').toLowerCase()
    const usedAnalisis = Number(meta.used_analisis || 0)
    const maxAnalisis = PLAN_LIMITS[userPlan] ?? 0

    const body = await req.json()
    const channels: Record<string, string>[] = body.channels || []
    const context: Record<string, string> = body.context || {}

    if (!channels.length) return NextResponse.json({ error: 'Sin canales' }, { status: 400 })

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

    // Process each channel
    const results: Record<string, Record<string, number>> = {}
    for (const ch of channels) {
      try {
        const msg = await ai.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 300,
          messages: [{ role: 'user', content: channelPrompt(ch, context) }],
        })
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        results[ch.channelId] = JSON.parse(clean)
      } catch {
        results[ch.channelId] = { inv: parseFloat(ch.suggestedInv) || 500 }
      }
    }

    // Update credits using admin API
    const newUsed = usedAnalisis + needed
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, used_analisis: newUsed }
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
