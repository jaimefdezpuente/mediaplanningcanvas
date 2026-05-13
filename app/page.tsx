'use client'
import { useState } from 'react'

export default function Home() {
  const [lang, setLang] = useState<'es'|'en'>('es')
  const [faq, setFaq] = useState<number|null>(null)

  const T = {
    es: {
      badge: '✦ Metodología probada en 10 años · IE Business School',
      h1a: 'Crea tu Plan de Marketing', h1b: 'desde cero con IA',
      sub: 'El Media Planning Canvas te guía fase a fase para crear un plan de marketing digital completo. Sin síndrome de la hoja en blanco.',
      cta1: 'Empieza gratis — 1 plan incluido', cta2: 'Ver cómo funciona',
      note: 'Sin tarjeta de crédito · Bilingüe ES/EN',
      phasesLabel: 'Las 5 fases del Media Planning Canvas',
      phasesTitle: 'Un método. Cinco pasos.',
      phases: [
        {n:'01',ic:'🌍',t:'Entorno',d:'Análisis de país, mercado, competencia y DAFO con IA.'},
        {n:'02',ic:'🎯',t:'Producto & Target',d:'USP, buyer persona completo y escalera de valor.'},
        {n:'03',ic:'📐',t:'Estrategia',d:'Objetivos, selección de canales y mix recomendado.'},
        {n:'04',ic:'📊',t:'Táctico & Presupuesto',d:'Distribución presupuestaria, ROAS, CAC y LTV.'},
        {n:'05',ic:'📄',t:'Resumen Ejecutivo',d:'Documento final exportable en PDF.'},
      ],
      featLabel: '¿Por qué Media Planning Canvas?',
      featTitle: 'No es otro chatbot de marketing',
      feats: [
        {ic:'🤖',t:'IA entrenada en marketing real',d:'Prompts diseñados por un experto con 10 años en escuelas de negocio.'},
        {ic:'🎬',t:'20+ horas de formación incluidas',d:'Jaime te explica cada fase en vídeo mientras creas tu plan.'},
        {ic:'📊',t:'Calculadora táctica integrada',d:'Calcula inversión, leads, clientes y ROAS por canal con benchmarks reales.'},
        {ic:'🌍',t:'Análisis de mercado real',d:'La IA investiga tu sector, competidores y target.'},
        {ic:'📄',t:'Export PDF profesional',d:'Tu plan completo como documento presentable.'},
        {ic:'🔄',t:'Edita, itera, mejora',d:'Tus planes se guardan. Cambia sector, ajusta presupuesto.'},
      ],
      stats: [{n:'10+',l:'Años enseñando la metodología'},{n:'4.000+',l:'Profesionales formados'},{n:'500+',l:'Planes de marketing creados'},{n:'5',l:'Fases. Un método completo.'}],
      proofLabel: 'La metodología detrás del Canvas',
      proofTitle: 'Construida en el aula, refinada en el mercado',
      proofSub: 'No nació de una pizarra blanca. Nació de 10 años enseñando a profesionales de marketing en IE Business School.',
      pricingLabel: 'Simple. Sin sorpresas.',
      pricingTitle: 'Un precio justo por un resultado real',
      plans: [
        {name:'Free',price:'€0',period:'',desc:'Para conocer el método',features:['1 plan completo','5 fases del Canvas','IA básica','Vídeos incluidos','Export PDF'],cta:'Empieza gratis',hi:false,note:'Sin tarjeta'},
        {name:'Pro',price:'€15',period:'/mes',desc:'Para profesionales',features:['Planes ilimitados','IA avanzada — análisis completo','Calculadora con benchmarks','20+ horas de vídeo','PDF profesional','Historial','Soporte prioritario'],cta:'7 días gratis',hi:true,note:'Luego €15/mes · Cancela cuando quieras'},
        {name:'Anual',price:'€120',period:'/año',desc:'Ahorra 2 meses',features:['Todo lo de Pro','2 meses gratis','Acceso anticipado','Comunidad privada'],cta:'Contratar anual',hi:false,note:'€10/mes'},
      ],
      faqTitle: 'Preguntas frecuentes',
      faqs: [
        {q:'¿Necesito saber marketing?',a:'El Canvas te guía paso a paso. Jaime explica cada fase en vídeo. Puedes crear un plan profesional desde el primer día.'},
        {q:'¿La IA qué datos necesita?',a:'País, sector, descripción del producto y competidores opcionales. La IA hace el resto.'},
        {q:'¿El plan es editable?',a:'Todo es editable. La IA es el punto de partida — tú lo ajustas y personalizas.'},
        {q:'¿En qué idioma funciona?',a:'Español e inglés. El análisis puede hacerse en cualquier idioma.'},
        {q:'¿Puedo cancelar?',a:'Sí. Sin permanencia, sin penalización. Un clic desde tu perfil.'},
        {q:'¿Funciona para cualquier sector?',a:'Sí. B2C, B2B, ecommerce, servicios, formación, startups...'},
      ],
      ctaTitle: 'Tu plan de marketing está a 5 pasos',
      ctaSub: 'Empieza ahora. El primer plan es gratis.',
      ctaBtn: 'Crear mi plan →',
    },
    en: {
      badge: '✦ 10-year proven methodology · IE Business School',
      h1a: 'Build your Marketing Plan', h1b: 'from scratch with AI',
      sub: 'Media Planning Canvas guides you step by step to create a complete digital marketing plan. No blank page syndrome.',
      cta1: 'Start free — 1 plan included', cta2: 'See how it works',
      note: 'No credit card · ES/EN bilingual',
      phasesLabel: 'The 5 phases of the Media Planning Canvas',
      phasesTitle: 'One method. Five steps.',
      phases: [
        {n:'01',ic:'🌍',t:'Environment',d:'Country, market, competition and SWOT analysis with AI.'},
        {n:'02',ic:'🎯',t:'Product & Target',d:'USP, full buyer persona and value ladder.'},
        {n:'03',ic:'📐',t:'Strategy',d:'Objectives, channel selection and recommended mix.'},
        {n:'04',ic:'📊',t:'Tactical & Budget',d:'Budget allocation, ROAS, CAC and LTV per channel.'},
        {n:'05',ic:'📄',t:'Executive Summary',d:'Exportable PDF document ready to present.'},
      ],
      featLabel: 'Why Media Planning Canvas?',
      featTitle: "It's not another marketing chatbot",
      feats: [
        {ic:'🤖',t:'AI trained on real marketing',d:'Prompts designed by an expert with 10 years in top business schools.'},
        {ic:'🎬',t:'20+ hours of training included',d:'Jaime explains every phase on video while you build your plan.'},
        {ic:'📊',t:'Integrated tactical calculator',d:'Calculate investment, leads, clients and ROAS with real benchmarks.'},
        {ic:'🌍',t:'Real market analysis',d:'AI researches your sector, competitors and target.'},
        {ic:'📄',t:'Professional PDF export',d:'Your complete plan as a presentable document.'},
        {ic:'🔄',t:'Edit, iterate, improve',d:'Plans are saved. Change sector, adjust budget.'},
      ],
      stats: [{n:'10+',l:'Years teaching the methodology'},{n:'4,000+',l:'Professionals trained'},{n:'500+',l:'Marketing plans created'},{n:'5',l:'Phases. One complete method.'}],
      proofLabel: 'The methodology behind the Canvas',
      proofTitle: 'Built in the classroom, refined in the market',
      proofSub: "Built over 10 years teaching marketing professionals at IE Business School.",
      pricingLabel: 'Simple. No surprises.',
      pricingTitle: 'A fair price for a real result',
      plans: [
        {name:'Free',price:'€0',period:'',desc:'To discover the method',features:['1 complete plan','All 5 phases','Basic AI','Videos included','PDF export'],cta:'Start free',hi:false,note:'No credit card'},
        {name:'Pro',price:'€15',period:'/month',desc:'For professionals',features:['Unlimited plans','Advanced AI','Calculator with benchmarks','20+ hours video','Professional PDF','History','Priority support'],cta:'7 days free',hi:true,note:'Then €15/month · Cancel anytime'},
        {name:'Annual',price:'€120',period:'/year',desc:'Save 2 months',features:['Everything in Pro','2 months free','Early access','Private community'],cta:'Get annual',hi:false,note:'€10/month'},
      ],
      faqTitle: 'Frequently asked questions',
      faqs: [
        {q:'Do I need marketing knowledge?',a:'The Canvas guides you step by step. Jaime explains on video. You can create a professional plan from day one.'},
        {q:'What data does AI need?',a:'Country, sector, product description and optional competitors. AI does the rest.'},
        {q:'Is the plan editable?',a:'Everything is editable. AI is the starting point — you adjust and personalise.'},
        {q:'What language?',a:'Spanish and English. Analysis can be done in any language.'},
        {q:'Can I cancel?',a:'Yes. No commitment, no penalty. One click from your profile.'},
        {q:'Any sector?',a:'Yes. B2C, B2B, ecommerce, services, education, startups...'},
      ],
      ctaTitle: 'Your marketing plan is 5 steps away',
      ctaSub: 'Start now. First plan is free.',
      ctaBtn: 'Build my plan →',
    }
  }

  const t = T[lang]
  const dark = '#07090f', card = '#111826', border = '#1e2d45', acc = '#0ea5e9', txt = '#f0f6ff', txt2 = '#94a3b8', txt3 = '#3d5370'

  return (
    <main style={{ position: 'relative', zIndex: 1 }}>
      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, borderBottom:`1px solid ${border}`, backgroundColor:'rgba(7,9,15,0.92)', backdropFilter:'blur(12px)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'#000' }}>M</div>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, color:txt }}>Media Planning Canvas</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={()=>setLang(lang==='es'?'en':'es')} style={{ fontSize:12, fontWeight:600, padding:'6px 12px', borderRadius:8, border:`1px solid ${border}`, background:'transparent', color:txt2, cursor:'pointer' }}>{lang==='es'?'EN':'ES'}</button>
            <a href="/login" style={{ fontSize:13, color:txt2, textDecoration:'none' }}>{lang==='es'?'Entrar':'Log in'}</a>
            <a href="/registro" style={{ fontSize:13, fontWeight:700, padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#000', textDecoration:'none' }}>{lang==='es'?'Empieza gratis':'Start free'}</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'96px 24px 64px', textAlign:'center' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', padding:'8px 16px', borderRadius:100, border:'1px solid rgba(14,165,233,0.3)', background:'rgba(14,165,233,0.08)', color:acc, fontSize:12, fontWeight:600, marginBottom:32 }}>{t.badge}</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'clamp(36px,6vw,72px)', lineHeight:1.05, letterSpacing:'-2px', marginBottom:24, color:txt }}>
            {t.h1a}<br/><span className="gradient-text">{t.h1b}</span>
          </h1>
          <p style={{ fontSize:18, color:txt2, maxWidth:600, margin:'0 auto 40px', lineHeight:1.7 }}>{t.sub}</p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', marginBottom:12 }}>
            <a href="/registro" style={{ padding:'14px 32px', borderRadius:12, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#000', fontWeight:700, fontSize:15, textDecoration:'none' }}>{t.cta1} →</a>
            <a href="#phases" style={{ padding:'14px 32px', borderRadius:12, border:`1px solid ${border}`, color:txt2, fontWeight:600, fontSize:15, textDecoration:'none' }}>▶ {t.cta2}</a>
          </div>
          <p style={{ fontSize:12, color:txt3 }}>{t.note}</p>
        </div>
      </section>

      {/* PHASES */}
      <section id="phases" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <p style={{ fontSize:11, fontWeight:600, color:acc, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{t.phasesLabel}</p>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'clamp(28px,4vw,48px)', color:txt, letterSpacing:'-1px' }}>{t.phasesTitle}</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
            {t.phases.map((ph,i)=>(
              <div key={i} style={{ background:card, border:`1px solid ${border}`, borderRadius:16, padding:24, textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:10 }}>{ph.ic}</div>
                <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, color:'#000', margin:'0 auto 10px' }}>{ph.n}</div>
                <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:txt, marginBottom:6 }}>{ph.t}</h3>
                <p style={{ fontSize:12, color:txt2, lineHeight:1.6 }}>{ph.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'#8b5cf6', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{t.featLabel}</p>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'clamp(24px,4vw,40px)', color:txt, letterSpacing:'-1px', marginBottom:12 }}>{t.featTitle}</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
            {t.feats.map((f,i)=>(
              <div key={i} style={{ background:card, border:`1px solid ${border}`, borderRadius:16, padding:24 }}>
                <div style={{ fontSize:26, marginBottom:12 }}>{f.ic}</div>
                <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:txt, marginBottom:6 }}>{f.t}</h3>
                <p style={{ fontSize:13, color:txt2, lineHeight:1.6 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section style={{ padding:'80px 24px', background:'rgba(14,165,233,0.03)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>
          <div>
            <p style={{ fontSize:11, fontWeight:600, color:acc, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>{t.proofLabel}</p>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'clamp(22px,3vw,36px)', color:txt, letterSpacing:'-1px', marginBottom:16 }}>{t.proofTitle}</h2>
            <p style={{ fontSize:15, color:txt2, lineHeight:1.7, marginBottom:24 }}>{t.proofSub}</p>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff' }}>JF</div>
              <div>
                <div style={{ fontWeight:600, fontSize:13, color:txt }}>Jaime Fernández de la Puente-Campano</div>
                <div style={{ fontSize:12, color:txt2 }}>Consultor Marketing · Ponente · IE Business School</div>
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {t.stats.map((s,i)=>(
              <div key={i} style={{ background:card, border:`1px solid ${border}`, borderRadius:16, padding:24, textAlign:'center' }}>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:32, color:acc, marginBottom:6 }}>{s.n}</div>
                <div style={{ fontSize:12, color:txt2, lineHeight:1.4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'#10b981', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>{t.pricingLabel}</p>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'clamp(24px,4vw,40px)', color:txt, letterSpacing:'-1px' }}>{t.pricingTitle}</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20 }}>
            {t.plans.map((pl,i)=>(
              <div key={i} style={{ background:card, border:`1px solid ${pl.hi?acc:border}`, borderRadius:16, padding:28, display:'flex', flexDirection:'column', position:'relative', boxShadow:pl.hi?'0 0 32px rgba(14,165,233,0.1)':'none' }}>
                {pl.hi&&<div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', padding:'3px 14px', borderRadius:100, background:acc, color:'#000', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>⭐ {lang==='es'?'Más popular':'Most popular'}</div>}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:txt, marginBottom:4 }}>{pl.name}</div>
                  <div style={{ fontSize:12, color:txt2, marginBottom:14 }}>{pl.desc}</div>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:4 }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:36, color:txt }}>{pl.price}</span>
                    <span style={{ fontSize:13, color:txt2, paddingBottom:5 }}>{pl.period}</span>
                  </div>
                </div>
                <ul style={{ listStyle:'none', marginBottom:24, flex:1 }}>
                  {pl.features.map((f,j)=>(
                    <li key={j} style={{ display:'flex', gap:8, fontSize:13, color:txt2, marginBottom:8 }}>
                      <span style={{ color:'#10b981', flexShrink:0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a href="/registro" style={{ display:'block', textAlign:'center', padding:'11px', borderRadius:10, background:pl.hi?'linear-gradient(135deg,#0ea5e9,#0284c7)':'transparent', border:pl.hi?'none':`1px solid ${border}`, color:pl.hi?'#000':txt2, fontWeight:600, fontSize:13, textDecoration:'none' }}>{pl.cta}</a>
                <p style={{ fontSize:11, color:txt3, textAlign:'center', marginTop:6 }}>{pl.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding:'72px 24px' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:30, color:txt, textAlign:'center', marginBottom:40 }}>{t.faqTitle}</h2>
          {t.faqs.map((item,i)=>(
            <div key={i} style={{ background:card, border:`1px solid ${border}`, borderRadius:12, overflow:'hidden', marginBottom:10 }}>
              <button onClick={()=>setFaq(faq===i?null:i)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', gap:12 }}>
                <span style={{ fontWeight:600, fontSize:14, color:txt }}>{item.q}</span>
                <span style={{ color:txt2, fontSize:18, transform:faq===i?'rotate(45deg)':'none', transition:'transform 0.2s', flexShrink:0 }}>+</span>
              </button>
              {faq===i&&<div style={{ padding:'0 18px 14px', fontSize:13, color:txt2, lineHeight:1.7, borderTop:`1px solid ${border}`, paddingTop:12 }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section style={{ padding:'80px 24px', textAlign:'center' }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'clamp(26px,4vw,44px)', color:txt, letterSpacing:'-1px', marginBottom:14 }}>{t.ctaTitle}</h2>
        <p style={{ fontSize:16, color:txt2, marginBottom:28 }}>{t.ctaSub}</p>
        <a href="/registro" style={{ display:'inline-block', padding:'15px 40px', borderRadius:12, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#000', fontWeight:700, fontSize:15, textDecoration:'none' }}>{t.ctaBtn}</a>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${border}`, padding:'40px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#000' }}>M</div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, color:txt }}>Media Planning Canvas</div>
              <div style={{ fontSize:11, color:txt3 }}>by Jaime Fernández de la Puente-Campano</div>
            </div>
          </div>
          <p style={{ fontSize:12, color:txt3 }}>© {new Date().getFullYear()} Media Planning Canvas</p>
        </div>
      </footer>
    </main>
  )
}
