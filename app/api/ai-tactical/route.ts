import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PLAN_LIMITS: Record<string, number> = {
  free: 3, pro: 20, business: 60, enterprise: 999,
}

function daysUntilRenewal(periodStart: string | undefined): number | null {
  if (!periodStart) return null
  const start = new Date(periodStart)
  const now   = new Date()
  const next  = new Date(start)
  while (next <= now) next.setMonth(next.getMonth() + 1)
  return Math.ceil((next.getTime() - now.getTime()) / 86_400_000)
}

function channelPrompt(ch: Record<string, string>, ctx: Record<string, string>): string {
  const isModoVentas = ctx.tactico_mode === 'ventas'
  const budget       = parseFloat(ctx.budget  || '0')
  const clients      = parseFloat(ctx.clients || '0')
  const ticket       = parseFloat(ctx.ticket  || '0')

  const phaseContext: Record<string, string> = {
    notoriedad:   'Canal de NOTORIEDAD. Genera awareness, no convierte directamente.',
    interaccion:  'Canal de TRAFICO. Lleva visitas cualificadas al funnel.',
    lead_venta:   'Canal de CONVERSION directa. Genera ventas y clientes. Aqui esta el ROI.',
    fidelizacion: 'Canal de RETENCION. Incrementa LTV y frecuencia de compra.',
  }

  const benchmarks = ctx.mode === 'B2B'
    ? 'B2B benchmarks: lead2mql 20-40%, mql2sql 40-60%, demo2client 15-30%, CPL LinkedIn 40-120EUR, CPL Google 20-80EUR.'
    : 'B2C benchmarks: carrito2venta 25-45%, CTR Meta 1-3%, CTR Google 2-5%, CPM Display 3-8EUR, CPC Meta 0.5-2EUR.'

  const uspLine      = ctx.usp            ? `USP: ${ctx.usp.slice(0, 150)}` : ''
  const targetLine   = ctx.target_desc    ? `Target: ${ctx.target_desc.slice(0, 150)}` : ''
  const escaleraLine = ctx.escalera_valor ? `Escalera: ${ctx.escalera_valor.slice(0, 200)}` : ''

  const modoInstruccion = isModoVentas
    ? `MODO VENTAS: objetivo ${clients} clientes, ticket ${ticket}EUR, ingreso objetivo ${(clients * ticket).toFixed(0)}EUR. Asigna inversion optima segun ROI real. Si el canal no aporta a ventas directas, inv=0.`
    : `MODO PRESUPUESTO: total ${budget}EUR entre estos canales: [${ctx.all_channels || ch.name}]. Asigna la inversion optima para ESTE canal segun su ROI. NO repartas por igual. El mejor canal puede llevar el 60-70% si tiene mejor ROI. Si este canal no es eficiente, inv=0.`

  return [
    `Media planner senior, sector ${ctx.sector}, modelo ${ctx.mode}, fase ${ctx.phase}.`,
    '',
    `Presupuesto: ${budget}EUR | Objetivo: ${clients} clientes | Ticket: ${ticket}EUR`,
    uspLine, targetLine, escaleraLine,
    '',
    modoInstruccion,
    '',
    `Canal: ${ch.name} | Tipo: ${phaseContext[ch.phase] || ch.phase}`,
    `Campos: ${ch.fields}`,
    '',
    benchmarks,
    '',
    'RESPONDE SOLO JSON sin markdown. inv puede ser 0. Todos los ratios coherentes.',
    'Ejemplo: {"inv":2000,"cpm":8,"ctr":1.8}',
  ].filter(Boolean).join('\n')
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

    const meta         = user.user_metadata || {}
    const userPlan     = ((meta.plan as string) || 'free').toLowerCase()
    const usedAnalisis = Number(meta.used_analisis || 0)
    const maxAnalisis  = PLAN_LIMITS[userPlan] ?? 0
    const isFree       = userPlan === 'free'
    const renewalDays  = isFree ? null : daysUntilRenewal(meta.plan_period_start as string | undefined)

    const { channels, context } = await req.json() as {
      channels: Record<string, string>[]
      context:  Record<string, string>
    }

    if (!channels?.length || channels.length < 3)
      return NextResponse.json({ error: 'Minimo 3 canales' }, { status: 400 })

    const needed    = channels.length
    const remaining = maxAnalisis - usedAnalisis

    if (remaining < needed) {
      return NextResponse.json({
        error:        'credits_insufficient',
        needed, remaining, plan: userPlan,
        is_free:      isFree,
        renewal_days: renewalDays,
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
      success: true, results,
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
