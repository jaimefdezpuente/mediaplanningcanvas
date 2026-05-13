import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
type D = Record<string, string>

const PROMPTS: Record<string, (d: D) => string> = {
  entorno: (d) => `Eres experto en marketing digital. Analiza el entorno para:
País: ${d.pais} | Sector: ${d.sector} | Producto: ${d.producto} | Competidores: ${d.competidores || 'No especificados'}
Devuelve SOLO JSON sin markdown:
{"situacion_pais":{"resumen":"2-3 frases contexto económico","pib_tendencia":"tendencia","variables_macro":["v1","v2","v3"],"oportunidades_pais":["op1","op2"]},"mercado":{"descripcion":"descripción 2-3 frases","tamano_estimado":"tamaño con datos","tendencia":"tendencia","players_principales":["p1","p2","p3"]},"competencia":{"analisis":"análisis 2 frases","competidores":[{"nombre":"nombre","fortaleza":"fortaleza","debilidad":"debilidad"}]},"dafo":{"oportunidades":["op1","op2","op3"],"amenazas":["am1","am2","am3"]}}`,

  target: (d) => `Eres experto en marketing. Genera target y buyer persona COMPLETO. Máximo 3 items por array.
País: ${d.pais} | Sector: ${d.sector} | Producto: ${d.producto} | Tipo: ${d.tipo_negocio} | USP: ${d.usp || 'No definida'}
Devuelve SOLO JSON sin markdown:
{"core_target":{"descripcion":"1 frase","sociodemografico":{"sexo":"predominante","edad":"rango","clase_social":"clase","ubicacion":"ubicación"},"volumen_estimado":"número en el país"},"broad_target":{"descripcion":"descripción","volumen_estimado":"número"},"buyer_persona":{"nombre":"nombre ficticio","edad":35,"profesion":"profesión","descripcion_narrativa":"Párrafo 3-4 frases en tercera persona con nombre, rol y relación con el producto","momentos_pensamiento":["m1","m2","m3"],"que_piensa_producto":["p1","p2","p3"],"donde_se_informa":["f1","f2","f3"],"que_escucha_mercado":["t1","t2","t3"],"que_dice":["d1","d2","d3"],"expectativas":["e1","e2","e3"],"barreras_compra":["b1","b2","b3"],"barreras_comunicacion":["c1","c2","c3"],"consumer_insight":["i1","i2","i3"]},"escalera_valor":[{"paso":1,"tipo":"TOFU","accion":"acción gratuita captación","objetivo":"objetivo"},{"paso":2,"tipo":"MOFU","accion":"acción consideración","objetivo":"objetivo"},{"paso":3,"tipo":"BOFU","accion":"acción conversión","objetivo":"objetivo"},{"paso":4,"tipo":"FIDELIZACIÓN","accion":"acción retención","objetivo":"objetivo"}]}`,

  estrategia: (d) => `Eres experto en marketing. Crea estrategia basada en objetivos y canales del usuario.
Negocio: País: ${d.pais} | Sector: ${d.sector} | Producto: ${d.producto} | Tipo: ${d.tipo_negocio} | Fase: ${d.fase_negocio}
USP: ${d.usp || 'No definida'} | Fortalezas: ${d.fortalezas || 'No definidas'}
Objetivos: ${d.objetivos || 'No definidos'}
Canales seleccionados: ${d.canales_seleccionados || 'Ninguno seleccionado'}
Devuelve SOLO JSON sin markdown:
{"estrategia_resumen":"3-4 frases explicando la estrategia","canales_por_fase":{"notoriedad":[{"canal":"nombre","accion":"acción","kpi":"KPI","presupuesto_pct":20,"razon":"razón"}],"interaccion":[{"canal":"nombre","accion":"acción","kpi":"KPI","presupuesto_pct":15,"razon":"razón"}],"lead_venta":[{"canal":"nombre","accion":"acción","kpi":"KPI","presupuesto_pct":40,"razon":"razón"}],"fidelizacion":[{"canal":"nombre","accion":"acción","kpi":"KPI","presupuesto_pct":25,"razon":"razón"}]},"quick_wins":["acción1","acción2","acción3"]}`,

  escalera_ideas: (d) => `Sugiere 3 nuevas ideas de pasos para la escalera de valor.
Producto: ${d.producto} | Sector: ${d.sector} | Pasos actuales: ${d.pasos_actuales || 'Ninguno'}
Devuelve SOLO JSON sin markdown:
{"nuevos_pasos":[{"tipo":"TOFU","accion":"acción","objetivo":"objetivo"},{"tipo":"MOFU","accion":"acción","objetivo":"objetivo"},{"tipo":"BOFU","accion":"acción","objetivo":"objetivo"}]}`,

  refine: (d) => `Mejora este texto de marketing según la instrucción.
Campo: ${d.field_key} | Texto actual: ${d.current_value} | Instrucción: ${d.user_prompt}
Devuelve SOLO JSON sin markdown: {"refined_text":"texto mejorado"}`,
}

export async function POST(req: NextRequest) {
  try {
    const { fase, datos } = await req.json()
    const promptFn = PROMPTS[fase]
    if (!promptFn) return NextResponse.json({ error: 'Fase no válida' }, { status: 400 })
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
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ error: 'Error en la IA' }, { status: 500 })
  }
}
