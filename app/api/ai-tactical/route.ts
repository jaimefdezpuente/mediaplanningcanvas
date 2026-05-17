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
  const budget       = parseFloat(ctx.budget || '0')
  const clients      = parseFloat(ctx.clients || '0')
  const ticket       = parseFloat(ctx.ticket  || '0')

  const phaseContext: Record<string, string> = {
    notoriedad:   'Canal de NOTORIEDAD. Genera awareness. No convierte directamente pero sienta las bases. Una buena presencia puede acelerar los canales de conversión.',
    interaccion:  'Canal de TRÁFICO. Lleva visitas cualificadas al funnel. Impacta directamente el volumen de leads y conversiones.',
    lead_venta:   'Canal de CONVERSIÓN. Genera ventas directas. Aquí es donde se consiguen los clientes y el ROI.',
    fidelizacion: 'Canal de RETENCIÓN. Incrementa LTV y frecuencia de compra de clientes existentes.',
  }

  const benchmarks = ctx.mode === 'B2B'
    ? 'B2B benchmarks reales: lead2mql 20-40%, mql2sql 40-60%, demo2client 15-30%, CPL LinkedIn €40-120, CPL Google €20-80, cierre demos 15-25%.'
    : 'B2C benchmarks reales: carrito2venta 25-45%, CTR Meta 1-3%, CTR Google 2-5%, CPM Display €3-8, CPC Meta €0.5-2, CTR Email 15-25%.'

  const uspLine      = ctx.usp           ? `
- USP del producto: "${ctx.usp.slice(0, 150)}"` : ''
  const targetLine   = ctx.target_desc   ? `
- Target: ${ctx.target_desc.slice(0, 150)}` : ''
  const escaleraLine = ctx.escalera_valor? `
- Escalera de valor: ${ctx.escalera_valor.slice(0, 300)}` : ''

  const modoInstruccion = isModoVentas
    ? `MODO OBJETIVO DE VENTAS:
- Meta: conseguir ${clients} clientes · ticket €${ticket} · ingreso objetivo €${(clients * ticket).toFixed(0)}
- Calcula la inversión óptima para este canal según su potencial real de contribuir a esa meta.
- Si el canal es poco eficiente para ese objetivo, asigna inv:0 o inv muy bajo.
- Si el canal tiene alto potencial de conversión directa, puede absorber más presupuesto.
- No distribuyas de forma proporcional: razona cuánto necesita realmente este canal para funcionar.`
    : `MODO PRESUPUESTO FIJO:
- Presupuesto total: €${budget}
- Todos los canales del plan suman ese presupuesto. Canales disponibles: ${ctx.all_channels || ch.name}
- Para ESTE canal (${ch.name}), asigna la inversión óptima según su ROI esperado y fase del embudo.
- Si el canal no es eficiente o ya cubre otro canal esa necesidad, asigna inv:0.
- Prioriza los canales de conversión directa para maximizar clientes.
- El presupuesto no necesita repartirse equitativamente: el mejor canal puede recibir el 60-70% si tiene mejor ROI.`

  return [
    `Eres un media planner senior especializado en ${ctx.sector}, modelo ${ctx.mode}, fase ${ctx.phase}.`,
    '',
    'CONTEXTO DEL NEGOCIO:',
    `- Sector: ${ctx.sector} | Modelo: ${ctx.mode} | Fase negocio: ${ctx.phase}`,
    `- Presupuesto total: €${budget} | Objetivo: ${clients} clientes | Ticket medio: €${ticket}`,
    `- Objetivos: ${ctx.objetivos}${uspLine}${targetLine}${escaleraLine}`,
    '',
    'INSTRUCCIÓN CLAVE (obligatoria):',
    modoInstruccion,
    '',
    'CANAL QUE DEBES RELLENAR AHORA:',
    `- Canal: ${ch.name}`,
    `- Tipo: ${phaseContext[ch.phase] || ch.phase}`,
    `- Campos disponibles: ${ch.fields}`,
    '',
    'BENCHMARKS DE REFERENCIA:',
    benchmarks,
    '',
    'REGLAS IMPORTANTES:',
    '- Devuelve SOLO JSON puro, sin markdown, sin texto adicional.',
    '- inv es la inversión en EUR para este canal. Puede ser 0 si no es útil.',
    '- Todos los ratios deben ser coherentes con el sector y fase declarados.',
    '- Basate en benchmarks reales, no en valores genéricos o medios.',
    '- Ejemplo de formato: {"inv":2000,"cpm":8,"ctr":1.8}',
  ].join('
')
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
