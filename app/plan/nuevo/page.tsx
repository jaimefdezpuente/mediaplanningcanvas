'use client'
import { useState } from 'react'

const T = {
  es: {
    nav: { login: 'Entrar', cta: 'Empieza gratis' },
    hero: {
      badge: '✦ Metodología probada en 10 años · IE Business School',
      title1: 'Crea tu Plan de Marketing',
      title2: 'desde cero con IA',
      sub: 'El Media Planning Canvas te guía fase a fase para crear un plan de marketing digital completo. Sin síndrome de la hoja en blanco. Sin improvisación.',
      cta1: 'Empieza gratis — 1 plan incluido',
      cta2: 'Ver cómo funciona',
      note: 'Sin tarjeta de crédito · Bilingüe ES/EN',
    },
    phases: {
      label: 'Las 5 fases del Media Planning Canvas',
      title: 'Un método. Cinco pasos.',
      items: [
        { num: '01', icon: '🌍', title: 'Entorno', desc: 'Análisis de país, mercado, competencia y DAFO con IA en segundos.' },
        { num: '02', icon: '🎯', title: 'Producto & Target', desc: 'USP, buyer persona, escalera de valor y consumo de medios.' },
        { num: '03', icon: '📐', title: 'Estrategia', desc: 'Objetivos de marketing, canales y mix óptimo para tu negocio.' },
        { num: '04', icon: '📊', title: 'Táctico & Presupuesto', desc: 'Distribución presupuestaria, ROAS, CAC y LTV por canal.' },
        { num: '05', icon: '📄', title: 'Resumen Ejecutivo', desc: 'Documento final exportable en PDF listo para presentar.' },
      ],
    },
    features: {
      label: '¿Por qué Media Planning Canvas?',
      title: 'No es otro chatbot de marketing',
      sub: 'Es una metodología estructurada de 10 años potenciada con IA. Cada campo tiene un propósito.',
      items: [
        { icon: '🤖', title: 'IA entrenada en marketing real', desc: 'Prompts diseñados por un experto con 10 años en escuelas de negocio. Análisis de verdad, no respuestas genéricas.' },
        { icon: '🎬', title: '20+ horas de formación incluidas', desc: 'Jaime te explica cada fase en vídeo. Aprendes mientras creas tu plan.' },
        { icon: '📊', title: 'Calculadora táctica integrada', desc: 'Calcula inversión, leads, clientes y ROAS por canal con benchmarks reales por sector.' },
        { icon: '🌍', title: 'Análisis de mercado real', desc: 'La IA investiga tu sector, competidores y target con datos reales del mercado.' },
        { icon: '📄', title: 'Export PDF profesional', desc: 'Tu plan completo como documento presentable para tu equipo, inversores o clientes.' },
        { icon: '🔄', title: 'Edita, itera, mejora', desc: 'Tus planes se guardan y son editables. Ajusta presupuesto, explora alternativas.' },
      ],
    },
    stats: [
      { num: '10+', label: 'Años impartiendo la metodología' },
      { num: '4.000+', label: 'Profesionales formados' },
      { num: '500+', label: 'Planes de marketing creados' },
      { num: '5', label: 'Fases. Un método completo.' },
    ],
    pricing: [
      {
        name: 'Free', price: '€0', period: '', desc: 'Para conocer el método',
        features: ['1 plan de marketing completo', 'Las 5 fases del Canvas', 'IA con análisis básico', 'Vídeos formativos incluidos', 'Export PDF'],
        cta: 'Empieza gratis', highlight: false, note: 'Sin tarjeta de crédito',
      },
      {
        name: 'Pro', price: '€15', period: '/mes', desc: 'Para profesionales y consultores',
        features: ['Planes ilimitados', 'IA avanzada — análisis completo', 'Calculadora táctica con benchmarks', '20+ horas de vídeo formación', 'Export PDF profesional', 'Historial y versiones', 'Soporte prioritario'],
        cta: 'Empezar 7 días gratis', highlight: true, note: 'Luego €15/mes · Cancela cuando quieras',
      },
      {
        name: 'Anual', price: '€120', period: '/año', desc: 'Ahorra 2 meses',
        features: ['Todo lo de Pro', '2 meses gratis vs mensual', 'Acceso a novedades antes que nadie', 'Comunidad privada de usuarios'],
        cta: 'Contratar anual', highlight: false, note: '€10/mes · La opción más inteligente',
      },
    ],
    faq: [
      { q: '¿Necesito saber marketing para usarlo?', a: 'El Canvas te guía paso a paso. Jaime explica cada fase en vídeo. Si tienes una empresa o idea de negocio, puedes crear un plan profesional desde el primer día.' },
      { q: '¿La IA qué datos necesita?', a: 'Solo país, sector, descripción de tu producto y 3 competidores opcionales. La IA hace el resto.' },
      { q: '¿El plan que genera la IA es editable?', a: 'Todo es editable. La IA es el punto de partida — tú lo ajustas y personalizas.' },
      { q: '¿En qué idioma funciona?', a: 'La plataforma está en español e inglés. El análisis de IA puede hacerse en cualquier idioma.' },
      { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Sin permanencia, sin penalización. Cancelas en un clic desde tu perfil.' },
      { q: '¿Funciona para cualquier sector?', a: 'Sí. B2C, B2B, ecommerce, servicios, formación, startups... La IA adapta el análisis al sector.' },
    ],
    proofTitle: 'Construida en el aula, refinada en el mercado',
    proofSub: 'No nació de una pizarra blanca. Nació de 10 años enseñando a profesionales de marketing en IE Business School y otras escuelas de negocio europeas.',
    proofLabel: 'La metodología detrás del Canvas',
    ctaTitle: 'Tu plan de marketing está a 5 pasos',
    ctaSub: 'Empieza ahora. El primer plan es gratis.',
    ctaBtn: 'Crear mi plan de marketing →',
    pricingLabel: 'Simple. Sin sorpresas.',
    pricingTitle: 'Un precio justo por un resultado real',
    pricingNote: 'Cancela cuando quieras. Sin permanencia.',
    faqTitle: 'Preguntas frecuentes',
  },
  en: {
    nav: { login: 'Log in', cta: 'Start free' },
    hero: {
      badge: '✦ 10-year proven methodology · IE Business School',
      title1: 'Build your Marketing Plan',
      title2: 'from scratch with AI',
      sub: 'Media Planning Canvas guides you step by step to create a complete digital marketing plan. No blank page syndrome. No guesswork.',
      cta1: 'Start free — 1 plan included',
      cta2: 'See how it works',
      note: 'No credit card · ES/EN bilingual',
    },
    phases: {
      label: 'The 5 phases of the Media Planning Canvas',
      title: 'One method. Five steps.',
      items: [
        { num: '01', icon: '🌍', title: 'Environment', desc: 'Country analysis, market size, competition and SWOT — AI-generated in seconds.' },
        { num: '02', icon: '🎯', title: 'Product & Target', desc: 'USP, buyer persona, value ladder and media consumption insights.' },
        { num: '03', icon: '📐', title: 'Strategy', desc: 'Marketing objectives, channel selection and optimal media mix.' },
        { num: '04', icon: '📊', title: 'Tactical & Budget', desc: 'Budget allocation, ROAS, CAC and LTV per channel.' },
        { num: '05', icon: '📄', title: 'Executive Summary', desc: 'Exportable final document in PDF ready to present.' },
      ],
    },
    features: {
      label: 'Why Media Planning Canvas?',
      title: "It's not another marketing chatbot",
      sub: "A structured 10-year methodology powered by AI. Every field has a purpose.",
      items: [
        { icon: '🤖', title: 'AI trained on real marketing', desc: 'Prompts designed by an expert with 10 years in top business schools. Real analysis, not generic questions.' },
        { icon: '🎬', title: '20+ hours of training included', desc: 'Jaime explains every phase on video. You learn while you build your plan.' },
        { icon: '📊', title: 'Integrated tactical calculator', desc: 'Calculate investment, leads, clients and ROAS per channel with real benchmarks.' },
        { icon: '🌍', title: 'Real market analysis', desc: 'AI researches your sector, competitors and target with real market data.' },
        { icon: '📄', title: 'Professional PDF export', desc: 'Your complete plan as a presentable document for your team or clients.' },
        { icon: '🔄', title: 'Edit, iterate, improve', desc: 'Your plans are saved and editable. Adjust budget, explore alternatives.' },
      ],
    },
    stats: [
      { num: '10+', label: 'Years teaching the methodology' },
      { num: '4,000+', label: 'Marketing professionals trained' },
      { num: '500+', label: 'Marketing plans created' },
      { num: '5', label: 'Phases. One complete method.' },
    ],
    pricing: [
      {
        name: 'Free', price: '€0', period: '', desc: 'To discover the method',
        features: ['1 complete marketing plan', 'All 5 Canvas phases', 'AI basic analysis', 'Training videos included', 'PDF export'],
        cta: 'Start free', highlight: false, note: 'No credit card',
      },
      {
        name: 'Pro', price: '€15', period: '/month', desc: 'For professionals and consultants',
        features: ['Unlimited plans', 'Advanced AI — full market analysis', 'Tactical calculator with benchmarks', '20+ hours of video training', 'Professional PDF export', 'History and versions', 'Priority support'],
        cta: 'Start 7-day free trial', highlight: true, note: 'Then €15/month · Cancel anytime',
      },
      {
        name: 'Annual', price: '€120', period: '/year', desc: 'Save 2 months',
        features: ['Everything in Pro', '2 months free vs monthly', 'Early access to new features', 'Private user community'],
        cta: 'Get annual plan', highlight: false, note: '€10/month · The smart choice',
      },
    ],
    faq: [
      { q: 'Do I need marketing knowledge?', a: 'The Canvas guides you step by step. Jaime explains each phase on video. You can create a professional plan from day one.' },
      { q: 'What data does the AI need?', a: 'Just country, sector, product description and 3 optional competitors. The AI does the rest.' },
      { q: 'Can I edit the AI-generated plan?', a: 'Everything is editable. AI is the starting point — you adjust and personalise it.' },
      { q: 'What language does it work in?', a: 'The platform is in Spanish and English. AI analysis can be done in any language.' },
      { q: 'Can I cancel anytime?', a: 'Yes. No commitment, no penalty. Cancel with one click from your profile.' },
      { q: 'Does it work for any sector?', a: 'Yes. B2C, B2B, ecommerce, services, education, startups... AI adapts to your sector.' },
    ],
    proofTitle: 'Built in the classroom, refined in the market',
    proofSub: "Didn't start on a whiteboard. Built over 10 years teaching marketing professionals at IE Business School and other European business schools.",
    proofLabel: 'The methodology behind the Canvas',
    ctaTitle: 'Your marketing plan is 5 steps away',
    ctaSub: 'Start now. First plan is free.',
    ctaBtn: 'Build my marketing plan →',
    pricingLabel: 'Simple. No surprises.',
    pricingTitle: 'A fair price for a real result',
    pricingNote: 'Cancel anytime. No commitment.',
    faqTitle: 'Frequently asked questions',
  },
}

const S = {
  nav: { position:'fixed' as const, top:0, left:0, right:0, zIndex:50, borderBottom:'1px solid #1e2d45', backgroundColor:'rgba(7,9,15,0.92)', backdropFilter:'blur(12px)' },
  navInner: { maxWidth:1280, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 },
  logoIcon: { width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#000' },
  card: { background:'#111826', border:'1px solid #1e2d45', borderRadius:16, padding:24 },
  badge: { display:'inline-flex', alignItems:'center', padding:'8px 16px', borderRadius:100, border:'1px solid rgba(14,165,233,0.3)', background:'rgba(14,165,233,0.08)', color:'#38bdf8', fontSize:12, fontWeight:600, marginBottom:32 },
}

export default function Home() {
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const t = T[lang]

  return (
    <main style={{ position:'relative', zIndex:1 }}>

      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={S.logoIcon}>M</div>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, color:'#fff' }}>Media Planning Canvas</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} style={{ fontSize:12, fontWeight:600, padding:'6px 12px', borderRadius:8, border:'1px solid #1e2d45', background:'transparent', color:'#94a3b8', cursor:'pointer' }}>
              {lang === 'es' ? 'EN' : 'ES'}
            </button>
            <a href="/login" style={{ fontSize:13, color:'#94a3b8', textDecoration:'none' }}>{t.nav.login}</a>
            <a href="/registro" style={{ fontSize:13, fontWeight:700, padding:'8px 16px', borderRadius:8, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#000', textDecoration:'none' }}>{t.nav.cta}</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'96px 24px 64px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', textAlign:'center' }}>
          <div style={S.badge}>{t.hero.badge}</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'clamp(36px,6vw,72px)', lineHeight:1.05, letterSpacing:'-2px', marginBottom:24, color:'#f0f6ff' }}>
            {t.hero.title1}<br />
            <span style={{ background:'linear-gradient(135deg,#0ea5e9,#38bdf8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{t.hero.title2}</span>
          </h1>
          <p style={{ fontSize:18, color:'#94a3b8', maxWidth:640, margin:'0 auto 40px', lineHeight:1.7 }}>{t.hero.sub}</p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', marginBottom:16 }}>
            <a href="/registro" style={{ padding:'14px 32px', borderRadius:12, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#000', fontWeight:700, fontSize:15, textDecoration:'none' }}>{t.hero.cta1} →</a>
            <a href="#how" style={{ padding:'14px 32px', borderRadius:12, border:'1px solid #1e2d45', color:'#94a3b8', fontWeight:600, fontSize:15, textDecoration:'none' }}>▶ {t.hero.cta2}</a>
          </div>
          <p style={{ fontSize:12, color:'#3d5370' }}>{t.hero.note}</p>
        </div>
      </section>

      {/* PHASES */}
      <section id="how" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'#0ea5e9', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>{t.phases.label}</p>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'clamp(28px,4vw,48px)', color:'#f0f6ff', letterSpacing:'-1px' }}>{t.phases.title}</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
            {t.phases.items.map((phase, i) => (
              <div key={i} style={{ ...S.card, textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:10 }}>{phase.icon}</div>
                <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, color:'#000', margin:'0 auto 10px' }}>{phase.num}</div>
                <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:6 }}>{phase.title}</h3>
                <p style={{ fontSize:12, color:'#94a3b8', lineHeight:1.6 }}>{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'#8b5cf6', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>{t.features.label}</p>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'clamp(24px,4vw,40px)', color:'#f0f6ff', letterSpacing:'-1px', marginBottom:12 }}>{t.features.title}</h2>
            <p style={{ fontSize:16, color:'#94a3b8', maxWidth:520, margin:'0 auto' }}>{t.features.sub}</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
            {t.features.items.map((f, i) => (
              <div key={i} style={S.card}>
                <div style={{ fontSize:26, marginBottom:12 }}>{f.icon}</div>
                <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:6 }}>{f.title}</h3>
                <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section style={{ padding:'80px 24px', background:'rgba(14,165,233,0.03)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>
          <div>
            <p style={{ fontSize:11, fontWeight:600, color:'#0ea5e9', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>{t.proofLabel}</p>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'clamp(22px,3vw,36px)', color:'#f0f6ff', letterSpacing:'-1px', marginBottom:16 }}>{t.proofTitle}</h2>
            <p style={{ fontSize:15, color:'#94a3b8', lineHeight:1.7, marginBottom:24 }}>{t.proofSub}</p>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff', flexShrink:0 }}>JF</div>
              <div>
                <div style={{ fontWeight:600, fontSize:13, color:'#f0f6ff' }}>Jaime Fernández de la Puente-Campano</div>
                <div style={{ fontSize:12, color:'#94a3b8' }}>Co-fundador PeopleXBrand · Consultor · Ponente</div>
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {t.stats.map((s, i) => (
              <div key={i} style={{ ...S.card, textAlign:'center' }}>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:32, color:'#0ea5e9', marginBottom:6 }}>{s.num}</div>
                <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'#10b981', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>{t.pricingLabel}</p>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'clamp(24px,4vw,40px)', color:'#f0f6ff', letterSpacing:'-1px', marginBottom:10 }}>{t.pricingTitle}</h2>
            <p style={{ fontSize:15, color:'#94a3b8' }}>{t.pricingNote}</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20 }}>
            {t.pricing.map((plan, i) => (
              <div key={i} style={{ background:'#111826', border:`1px solid ${plan.highlight ? '#0ea5e9' : '#1e2d45'}`, borderRadius:16, padding:28, display:'flex', flexDirection:'column', position:'relative', boxShadow:plan.highlight ? '0 0 32px rgba(14,165,233,0.1)' : 'none' }}>
                {plan.highlight && (
                  <div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', padding:'3px 14px', borderRadius:100, background:'#0ea5e9', color:'#000', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
                    {lang === 'es' ? '⭐ Más popular' : '⭐ Most popular'}
                  </div>
                )}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'#f0f6ff', marginBottom:4 }}>{plan.name}</div>
                  <div style={{ fontSize:12, color:'#94a3b8', marginBottom:14 }}>{plan.desc}</div>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:4 }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:36, color:'#f0f6ff' }}>{plan.price}</span>
                    <span style={{ fontSize:13, color:'#94a3b8', paddingBottom:5 }}>{plan.period}</span>
                  </div>
                </div>
                <ul style={{ listStyle:'none', marginBottom:24, flex:1 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:13, color:'#94a3b8', marginBottom:8 }}>
                      <span style={{ color:'#10b981', flexShrink:0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <div>
                  <a href="/registro" style={{ display:'block', textAlign:'center', padding:'11px', borderRadius:10, background:plan.highlight ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : 'transparent', border:plan.highlight ? 'none' : '1px solid #1e2d45', color:plan.highlight ? '#000' : '#94a3b8', fontWeight:600, fontSize:13, textDecoration:'none' }}>
                    {plan.cta}
                  </a>
                  <p style={{ fontSize:11, color:'#3d5370', textAlign:'center', marginTop:6 }}>{plan.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding:'72px 24px' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:30, color:'#f0f6ff', textAlign:'center', marginBottom:40 }}>{t.faqTitle}</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {t.faq.map((item, i) => (
              <div key={i} style={{ background:'#111826', border:'1px solid #1e2d45', borderRadius:12, overflow:'hidden' }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', gap:12 }}>
                  <span style={{ fontWeight:600, fontSize:13, color:'#f0f6ff' }}>{item.q}</span>
                  <span style={{ color:'#94a3b8', fontSize:18, flexShrink:0, transition:'transform 0.2s', transform:faqOpen === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {faqOpen === i && (
                  <div style={{ padding:'0 18px 14px', fontSize:13, color:'#94a3b8', lineHeight:1.7, borderTop:'1px solid #1e2d45', paddingTop:12 }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section style={{ padding:'80px 24px', textAlign:'center' }}>
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'clamp(26px,4vw,44px)', color:'#f0f6ff', letterSpacing:'-1px', marginBottom:14 }}>{t.ctaTitle}</h2>
          <p style={{ fontSize:16, color:'#94a3b8', marginBottom:28 }}>{t.ctaSub}</p>
          <a href="/registro" style={{ display:'inline-block', padding:'15px 40px', borderRadius:12, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#000', fontWeight:700, fontSize:15, textDecoration:'none' }}>{t.ctaBtn}</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid #1e2d45', padding:'40px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#000' }}>M</div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, color:'#f0f6ff' }}>Media Planning Canvas</div>
              <div style={{ fontSize:11, color:'#3d5370' }}>by Jaime Fernández de la Puente-Campano</div>
            </div>
          </div>
          <p style={{ fontSize:12, color:'#3d5370' }}>© {new Date().getFullYear()} Media Planning Canvas · Todos los derechos reservados</p>
        </div>
      </footer>

    </main>
  )
}

