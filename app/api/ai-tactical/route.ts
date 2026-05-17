import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PLAN_LIMITS: Record<string, number> = {
  free: 3, pro: 20, business: 60, enterprise: 999,
}

/** Días hasta que se renueven los créditos (null si plan free o sin fecha) */
function daysUntilRenewal(periodStart: string | undefined): number | null {
  if (!periodStart) return null
  const start = new Date(periodStart)
  const now   = new Date()
  // Siguiente ciclo mensual desde la fecha de inicio
  const next  = new Date(start)
  while (next <= now) next.setMonth(next.getMonth() + 1)
  return Math.ceil((next.getTime() - now.getTime()) / 86_400_000)
}

function channelPrompt(ch: Record<string, string>, ctx: Record<string, string>): string {
  const isModoVentas = ctx.tactico_mode === 'ventas'

  const modoInstruccion = isModoVentas
    ? `MODO VENTAS: El cliente quiere conseguir ${ctx.clients} ventas con ticket medio €${ctx.ticket}. Objetivo de ingresos: €${(parseFloat(ctx.clients||'0') * parseFloat(ctx.ticket||'0')).toFixed(0)}. Calcula la inversión necesaria para contribuir a ese objetivo.`
    : `MODO PRESUPUESTO: El cliente tiene €${ctx.budget} en total. Inversión sugerida para este canal: €${ch.suggestedInv}. Optimiza los ratios para maximizar clientes dentro del presupuesto.`

  const benchmarks = ctx.mode === 'B2B'
    ? 'B2B benchmarks: lead2mql 20-40%, mql2sql 40-60%, demo2client 15-30%, CPL LinkedIn €40-120, CPL Google €20-80.'
    : 'B2C benchmarks: carrito2venta 25-45%, CTR Meta 1-3%, CTR Google 2-5%, CPM Display €3-8, CPC Meta €0.5-2.'

  const phaseContext: Record<string, string> = {
    notoriedad:   'Canal de notoriedad: optimiza CPM, alcance e impresiones. No esperes conversión directa.',
    interaccion:  'Canal de tráfico: optimiza CTR y CPC. Objetivo: visitas cualificadas.',
    lead_venta:   'Canal de conversión: optimiza CPL, CR y CAC. Aquí se genera el ROI.',
    fidelizacion: 'Canal de retención: optimiza frecuencia de compra y LTV.',
  }

  const uspLine      = ctx.usp           ? `\n- USP: "${ctx.usp.slice(0, 150)}"` : ''
  const targetLine   = ctx.target_desc   ? `\n- Target: ${ctx.target_desc.slice(0, 150)}` : ''
  const escaleraLine = ctx.escalera_valor? `\n- Escalera de valor: ${ctx.escalera_valor.slice(0, 300)}` : ''

  return [
    `Eres media planner senior con 15 años de experiencia en ${ctx.sector}.`,
    '',
    'CONTEXTO DEL PROYECTO:',
    `- Sector: ${ctx.sector} | Modelo: ${ctx.mode} | Fase: ${ctx.phase}`,
    `- Presupuesto total: €${ctx.budget} | Objetivo clientes: ${ctx.clients} | Ticket: €${ctx.ticket}`,
    `- Objetivos: ${ctx.objetivos}${uspLine}${targetLine}${escaleraLine}`,
    '',
    'INSTRUCCIÓN DE OPTIMIZACIÓN:',
    modoInstruccion,
    '',
    'CANAL A RELLENAR:',
    `- Nombre: ${ch.name} | Fase: ${ch.phase}`,
    `- ${phaseContext[ch.phase] || ''}`,
    `- Campos: ${ch.fields}`,
    '',
    'BENCHMARKS:',
    benchmarks,
    '',
    'Devuelve SOLO JSON con números realistas. Ejemplo: {"inv":1500,"cpm":8,"ctr":1.5}',
  ].join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const meta        = user.user_metadata || {}
    const userPlan    = ((meta.plan as string) || 'free').toLowerCase()
    const usedAnalisis = Number(meta.used_analisis || 0)
    const maxAnalisis  = PLAN_LIMITS[userPlan] ?? 0
    const isFree       = userPlan === 'free'
    const periodStart  = meta.plan_period_start as string | undefined
    const renewalDays  = isFree ? null : daysUntilRenewal(periodStart)

    const { channels, context } = await req.json() as {
      channels: Record<string, string>[]
      context:  Record<string, string>
    }

    if (!channels?.length || channels.length < 3)
      return NextResponse.json({ error: 'Mínimo 3 canales' }, { status: 400 })

    const needed    = channels.length
    const remaining = maxAnalisis - usedAnalisis

    if (remaining < needed) {
      return NextResponse.json({
        error:        'credits_insufficient',
        needed,
        remaining,
        plan:         userPlan,
        is_free:      isFree,
        renewal_days: renewalDays,   // null si free o si no hay fecha registrada
        max:          maxAnalisis,
      }, { status: 402 })
    }

    const results: Record<string, Record<string, number>> = {}
    for (const ch of channels) {
      try {
        const msg  = await ai.messages.create({
          model:      'claude-sonnet-4-5',
          max_tokens: 300,
          messages:   [{ role: 'user', content: channelPrompt(ch, context) }],
        })
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
        results[ch.channelId] = JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim())
      } catch {
        results[ch.channelId] = { inv: Number(ch.suggestedInv) || 500 }
      }
    }

    await supabase.auth.updateUser({ data: { used_analisis: usedAnalisis + needed } })

    return NextResponse.json({
      success:      true,
      results,
      used:         usedAnalisis + needed,
      remaining:    maxAnalisis - usedAnalisis - needed,
      max:          maxAnalisis,
      plan:         userPlan,
      renewal_days: renewalDays,
    })
  } catch (err) {
    console.error('ai-tactical:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
