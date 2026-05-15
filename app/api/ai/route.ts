import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkAndConsumeCredit } from '@/lib/credits'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
type D = Record<string, string>

const PROMPTS: Record<string, (d: D) => string> = {
  competidores: (d) => [
    'Eres experto en marketing digital. Identifica los 3 competidores directos más relevantes.',
    'Producto/Servicio: ' + d.producto,
    'País: ' + d.pais,
    'Sector: ' + d.sector,
    'Web: ' + (d.web || 'No indicada'),
    'Devuelve SOLO JSON sin markdown:',
    '{"competidores":[{"nombre":"Nombre","descripcion":"1 frase","url":"web","razon":"razón"}]}',
  ].join('\n'),

  entorno: (d) => [
    'Eres experto en marketing digital. Analiza el entorno para:',
    'País: ' + d.pais + ' | Sector: ' + d.sector + ' | Producto: ' + d.producto + ' | Web: ' + (d.web||'N/A') + ' | Competidores: ' + (d.competidores||'No especificados'),
    'Devuelve SOLO JSON sin markdown:',
    '{"situacion_pais":{"resumen":"2-3 frases","pib_tendencia":"tendencia","variables_macro":["v1","v2","v3"],"oportunidades_pais":["op1","op2"]},"mercado":{"descripcion":"2-3 frases","tamano_estimado":"tamaño","tendencia":"tendencia","players_principales":["p1","p2","p3"]},"competencia":{"analisis":"2 frases","competidores":[{"nombre":"nombre","fortaleza":"fortaleza","debilidad":"debilidad"}]},"dafo":{"oportunidades":["op1","op2","op3","op4","op5"],"amenazas":["am1","am2","am3","am4","am5"]}}',
  ].join('\n'),

  target: (d) => [
    'Eres experto en marketing. Genera target y buyer persona COMPLETO. Máximo 3 items por array.',
    'País: ' + d.pais + ' | Sector: ' + d.sector + ' | Producto: ' + d.producto + ' | Tipo: ' + d.tipo_negocio + ' | USP: ' + (d.usp||'No definida'),
    'Devuelve SOLO JSON sin markdown:',
    '{"core_target":{"descripcion":"nicho en 1 frase","sociodemografico":{"sexo":"predominante","edad":"rango","clase_social":"clase","ubicacion":"ubicación"},"volumen_estimado":"número"},"broad_target":{"descripcion":"target amplio","sociodemografico":{"sexo":"predominante","edad":"rango","clase_social":"clase"},"volumen_estimado":"número"},"buyer_persona":{"nombre":"nombre ficticio","edad":35,"profesion":"profesión","descripcion_narrativa":"3-4 frases","momentos_pensamiento":["m1","m2","m3"],"que_piensa_producto":["p1","p2","p3"],"donde_se_informa":["f1","f2","f3"],"que_escucha_mercado":["t1","t2","t3"],"que_dice":["d1","d2","d3"],"expectativas":["e1","e2","e3"],"barreras_compra":["b1","b2","b3"],"barreras_comunicacion":["c1","c2","c3"],"consumer_insight":["i1","i2","i3"]},"escalera_valor":[{"paso":1,"tipo":"TOFU","accion":"acción captación","objetivo":"objetivo"},{"paso":2,"tipo":"MOFU","accion":"acción consideración","objetivo":"objetivo"},{"paso":3,"tipo":"BOFU","accion":"acción conversión","objetivo":"objetivo"},{"paso":4,"tipo":"FIDELIZACIÓN","accion":"acción retención","objetivo":"objetivo"}]}',
  ].join('\n'),

  objetivos_estimados: (d) => [
    'Eres experto en marketing. Sugiere 3 objetivos de marketing y 3 de comunicación realistas.',
    'Producto: ' + d.producto + ' | Sector: ' + d.sector + ' | Presupuesto: ' + d.presupuesto + ' | Tipo: ' + d.tipo_negocio + ' | Fase: ' + d.fase_negocio,
    'Target: ' + (d.target_desc||'No definido') + ' | USP: ' + (d.usp||'No definida'),
    'Devuelve SOLO JSON sin markdown:',
    '{"objetivos_marketing":[{"tipo":"Marketing","kpi":"nombre KPI","dato_estimado":"número","tiempo":"mes/trimestre/año","razon":"razón"},{"tipo":"Marketing","kpi":"...","dato_estimado":"...","tiempo":"...","razon":"..."},{"tipo":"Marketing","kpi":"...","dato_estimado":"...","tiempo":"...","razon":"..."}],"objetivos_comunicacion":[{"tipo":"Comunicación","kpi":"nombre KPI","dato_estimado":"número","tiempo":"mes/trimestre/año","razon":"razón"},{"tipo":"Comunicación","kpi":"...","dato_estimado":"...","tiempo":"...","razon":"..."},{"tipo":"Comunicación","kpi":"...","dato_estimado":"...","tiempo":"...","razon":"..."}]}',
  ].join('\n'),

  estrategia: (d) => [
    'Eres experto en marketing digital senior con 15 años de experiencia. Crea un plan estratégico de canales completo.',
    'DATOS DEL PROYECTO:',
    '- País: ' + d.pais + ' | Sector: ' + d.sector + ' | Producto: ' + d.producto,
    '- Tipo negocio: ' + d.tipo_negocio + ' | Fase: ' + d.fase_negocio,
    '- Presupuesto anual: ' + d.presupuesto,
    '- USP: ' + (d.usp||'No definida') + ' | Competidores: ' + (d.competidores||'No especificados'),
    '- Fortalezas: ' + (d.fortalezas||'No definidas'),
    'OBJETIVOS: ' + (d.objetivos||'No definidos'),
    'CANALES SELECCIONADOS: ' + (d.canales_seleccionados||'Ninguno, recomienda los mejores'),
    'TARGET: ' + (d.target_desc||'No definido'),
    'ESCALERA DE VALOR: ' + (d.escalera_valor||'No definida'),
    'Los % presupuesto deben sumar 100%.',
    'Devuelve SOLO JSON sin markdown:',
    '{"estrategia_resumen":"3-4 frases","canales_por_fase":{"notoriedad":[{"canal":"nombre","accion":"acción","kpi":"KPI con número","presupuesto_pct":20,"razon":"razón","score_ia":4}],"interaccion":[{"canal":"nombre","accion":"acción","kpi":"KPI","presupuesto_pct":15,"razon":"razón","score_ia":3}],"lead_venta":[{"canal":"nombre","accion":"acción","kpi":"KPI","presupuesto_pct":40,"razon":"razón","score_ia":5}],"fidelizacion":[{"canal":"nombre","accion":"acción","kpi":"KPI","presupuesto_pct":25,"razon":"razón","score_ia":4}]},"quick_wins":["acción 1","acción 2","acción 3"]}',
  ].join('\n'),

  canal_score: (d) => [
    'Eres experto en marketing digital. Puntúa del 1 al 5 cada canal según su idoneidad.',
    'Objetivos: ' + d.objetivos,
    'Sector: ' + d.sector + ' | Tipo: ' + d.tipo_negocio + ' | Fase: ' + d.fase_negocio + ' | Presupuesto: ' + d.presupuesto,
    'Canales: ' + d.canales,
    'Devuelve SOLO JSON sin markdown:',
    '{"scores":{"nombre_canal":{"score":4,"razon":"razón en 1 frase"}}}',
  ].join('\n'),

  escalera_ideas: (d) => [
    'Sugiere 3 nuevas ideas de pasos para la escalera de valor.',
    'Producto: ' + d.producto + ' | Sector: ' + d.sector + ' | Pasos actuales: ' + (d.pasos_actuales||'Ninguno'),
    'Devuelve SOLO JSON sin markdown:',
    '{"nuevos_pasos":[{"tipo":"TOFU","accion":"acción","objetivo":"objetivo"},{"tipo":"MOFU","accion":"acción","objetivo":"objetivo"},{"tipo":"BOFU","accion":"acción","objetivo":"objetivo"}]}',
  ].join('\n'),

  suggest_usp: (d) => [
    'Crea una USP impactante en una sola frase corta.',
    'Producto: ' + d.producto + ' | Sector: ' + d.sector + ' | Tipo: ' + d.tipo_negocio,
    'Devuelve SOLO JSON sin markdown: {"refined_text":"USP aqui"}',
  ].join('\n'),

  suggest_target: (d) => [
    'Sugiere Core y Broad Target para este negocio.',
    'Producto: ' + d.producto + ' | Sector: ' + d.sector + ' | Pais: ' + d.pais + ' | Tipo: ' + d.tipo_negocio + ' | USP: ' + (d.usp||''),
    'Devuelve SOLO JSON sin markdown: {"refined_text":"{\"core_desc\":\"...\"،\"core_volumen\":\"...\"،\"core_sociodem\":\"...\"،\"broad_desc\":\"...\"،\"broad_volumen\":\"...\"،\"broad_edad\":\"...\"|}"}',
  ].join('\n'),

  suggest_buyer: (d) => [
    'Crea un Buyer Persona completo. Max 3 bullets por campo.',
    'Producto: ' + d.producto + ' | Sector: ' + d.sector + ' | Tipo: ' + d.tipo_negocio + ' | USP: ' + (d.usp||''),
    'Devuelve SOLO JSON: {"refined_text":"{\"narrativa\":\"...\",\"momentos\":[\"...\"],\"piensa\":[\"...\"],\"informa\":[\"...\"],\"escucha\":[\"...\"],\"dice\":[\"...\"],\"expectativas\":[\"...\"],\"barreras_compra\":[\"...\"],\"insight\":[\"...\"]}"}',
  ].join('\n'),

  suggest_escalera: (d) => [
    'Sugiere 3 nuevos pasos para la escalera de valor.',
    'Producto: ' + d.producto + ' | Sector: ' + d.sector + ' | Pasos actuales: ' + (d.pasos_actuales||'Ninguno'),
    'Devuelve SOLO JSON sin markdown:',
    '{"nuevos_pasos":[{"tipo":"TOFU","accion":"acción","objetivo":"objetivo"},{"tipo":"MOFU","accion":"acción","objetivo":"objetivo"},{"tipo":"BOFU","accion":"acción","objetivo":"objetivo"}]}',
  ].join('\n'),

  refine: (d) => [
    'Mejora este texto de marketing según la instrucción del usuario.',
    'Campo: ' + d.field_key + ' | Texto: ' + d.current_value + ' | Instrucción: ' + d.user_prompt,
    'Devuelve SOLO JSON sin markdown: {"refined_text":"texto mejorado"}',
  ].join('\n'),
}

const MEJORAS_FASES = new Set(['refine'])
// Estas fases usan 'refine' internamente pero cuentan como analisis
const ANALISIS_OVERRIDE_FASES = new Set(['suggest_usp','suggest_target','suggest_buyer','suggest_escalera'])

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    )

    const { fase, datos } = await req.json()
    const promptFn = PROMPTS[fase]
    if (!promptFn) return NextResponse.json({ error: 'Fase no válida' }, { status: 400 })

    const creditType = MEJORAS_FASES.has(fase) ? 'mejoras' : 'analisis'
    const credit = await checkAndConsumeCredit(supabase, creditType)

    if (!credit.ok) {
      if (credit.reason === 'unauthenticated')
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      if (credit.reason === 'limit_reached')
        return NextResponse.json({ error: 'credits_insufficient', plan: credit.plan, remaining: credit.remaining }, { status: 402 })
      return NextResponse.json({ error: 'Error validando créditos' }, { status: 500 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: promptFn(datos) }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    let result
    try {
      result = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
    } catch {
      result = { raw: text, parse_error: true }
    }

    return NextResponse.json({ success: true, data: result, remaining: credit.remaining })
  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ error: 'Error en la IA' }, { status: 500 })
  }
}
