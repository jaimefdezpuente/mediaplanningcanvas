import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PLAN_LIMITS: Record<string, number> = {
  free: 0, pro: 20, business: 60, enterprise: 999,
}

function channelPrompt(ch: Record<string, string>, ctx: Record<string, string>): string {
  const isModoObjetivo = ctx.tactico_mode === 'objetivo'
  const modoInstruccion = isModoObjetivo
    ? `MODO OBJETIVO DE VENTAS: El cliente quiere conseguir ${ctx.clients} clientes con ticket medio EUR ${ctx.ticket}. Calcula la inversion NECESARIA en este canal para contribuir a ese objetivo. No te limites al presupuesto sugerido si necesitas mas para alcanzar el objetivo.`
    : `MODO PRESUPUESTO: El cliente tiene EUR ${ctx.budget} en total. La inversion sugerida para este canal es EUR ${ctx.suggestedInv}. Optimiza los ratios para maximizar clientes dentro de ese presupuesto.`

  const benchmarks = ctx.mode === 'B2B'
    ? 'B2B benchmarks: lead2mql 20-40%, mql2sql 40-60%, demo2client 15-30%, CPL LinkedIn EUR 40-120, CPL Google EUR 20-80.'
    : 'B2C benchmarks: carrito2venta 25-45%, CTR Meta 1-3%, CTR Google 2-5%, CPM Display EUR 3-8, CPC Meta EUR 0.5-2.'

  const phaseContext: Record<string, string> = {
    notoriedad: 'Canal de notoriedad: optimiza CPM, alcance e impresiones. No esperes conversion directa.',
    interaccion: 'Canal de trafico: optimiza CTR y CPC. El objetivo es traer visitas cualificadas.',
    lead_venta: 'Canal de conversion: optimiza CPL, tasa de conversion y CAC. Aqui se genera el ROI.',
    fidelizacion: 'Canal de retencion: optimiza frecuencia de compra y LTV. Coste bajo, alto retorno.',
  }

  return [
    'Eres media planner senior con 15 anos de experiencia en ' + ctx.sector + '.',
    '',
    'CONTEXTO DEL PROYECTO:',
    '- Sector: ' + ctx.sector,
    '- Modelo: ' + ctx.mode,
    '- Fase del negocio: ' + ctx.phase,
    '- Presupuesto total: EUR ' + ctx.budget,
    '- Objetivo clientes: ' + ctx.clients,
    '- Ticket medio: EUR ' + ctx.ticket,
    '',
    'INSTRUCCION DE OPTIMIZACION:',
    modoInstruccion,
    '',
    'CANAL A RELLENAR:',
    '- Nombre: ' + ch.name,
    '- Fase del embudo: ' + ch.phase,
    '- ' + (phaseContext[ch.phase] || ''),
    '- Campos disponibles: ' + ch.fields,
    '',
    'BENCHMARKS DEL SECTOR:',
    benchmarks,
    '',
    'INSTRUCCIONES:',
    '- Devuelve SOLO JSON con numeros reales y realistas para el sector.',
    '- Usa el campo "inv" para la inversion en EUR.',
    '- Si el modo es objetivo de ventas, calcula "inv" segun lo necesario para alcanzar el objetivo.',
    '- Si el modo es presupuesto, usa aproximadamente EUR ' + ch.suggestedInv + ' para "inv".',
    '- Todos los ratios deben ser coherentes entre si.',
    '- Ejemplo formato: {"inv":1500,"cpm":8,"ctr":1.5,"carrito2venta":35}',
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
