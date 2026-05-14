'use client'
import { useState } from 'react'
import { MpcMark, MpcLockup } from '@/lib/MpcLogo'

const C = {
  paper: '#F6F4EF', paper2: '#ECE8DF',
  navy: '#0F2942', navy7: '#163659',
  steel: '#4A6B8A', steel1: '#DDE2E8', steel3: '#8AA0B5',
  accent: '#C75A3C', white: '#FFFFFF',
}

const T = {
  es: {
    navLinks: ['Cómo funciona', 'Funcionalidades', 'Precios'],
    login: 'Entrar', cta: 'Empezar gratis',
    badge: 'Metodología probada · 10 años · IE Business School',
    h1a: 'Crea tu Plan de Marketing', h1b: 'en minutos, con IA.',
    sub: 'Media Planning Canvas te guía por las 5 fases del marketing digital. Sin síndrome de la hoja en blanco. Con la metodología que Jaime lleva una década enseñando en escuelas de negocio.',
    cta1: 'Empieza gratis', cta2: 'Ver cómo funciona',
    phasesLabel: 'La metodología',
    phasesTitle: 'Cinco fases. Un plan completo.',
    phases: [
      { n:'01', t:'Mercado', d:'Análisis de país, sector, competencia y DAFO con IA. Datos y contexto para tomar decisiones.' },
      { n:'02', t:'Target', d:'Buyer persona completo, USP, escalera de valor. Conoce a tu cliente en profundidad.' },
      { n:'03', t:'Objetivos & Estrategia', d:'Define qué quieres conseguir, elige tus canales y deja que la IA recomiende el mix.' },
      { n:'04', t:'Táctico & Presupuesto', d:'Distribución presupuestaria por canal, ROAS, CAC y LTV calculados.' },
      { n:'05', t:'Resumen Ejecutivo', d:'Documento final listo para presentar. Exportable en PDF.' },
    ],
    featLabel: '¿Por qué Media Planning Canvas?',
    featTitle: 'No es un chatbot. Es una metodología.',
    featSub: 'Cada campo tiene un propósito. Cada fase tiene un vídeo de Jaime explicándola.',
    feats: [
      { ic:'◈', t:'IA especializada en marketing', d:'Prompts diseñados por un experto. No preguntas genéricas — análisis real de mercado, competencia y target.' },
      { ic:'▶', t:'20+ horas de formación incluidas', d:'Jaime te explica cada fase en vídeo. Aprendes mientras creas tu plan.' },
      { ic:'⊞', t:'Calculadora táctica integrada', d:'Calcula inversión, leads, clientes y ROAS con benchmarks reales del sector.' },
      { ic:'✦', t:'Campos editables con IA', d:'Cada resultado es editable. El botón ✨ te permite mejorar campo a campo con un prompt propio.' },
      { ic:'↓', t:'Export PDF profesional', d:'Tu plan listo para presentar a clientes, inversores o a tu equipo.' },
      { ic:'⊙', t:'Todo guardado en tu cuenta', d:'Tus planes se guardan. Vuelve cuando quieras, edita, itera, mejora.' },
    ],
    proofLabel: 'La metodología detrás del Canvas',
    proofTitle: 'Construida en el aula.\nRefinada en el mercado.',
    proofSub: 'No nació de una pizarra blanca. Nació de 10 años enseñando a profesionales de marketing en IE Business School y otras escuelas de negocio europeas. Más de 4.000 alumnos han pasado por la metodología.',
    stats: [
      { n:'10+', l:'Años impartiendo la metodología' },
      { n:'4.000+', l:'Profesionales formados' },
      { n:'500+', l:'Planes de marketing creados' },
      { n:'5', l:'Fases. Un método completo.' },
    ],
    pricingLabel: 'Precios',
    pricingTitle: 'Elige tu plan',
    pricingSub: 'Sin permanencia. Cancela cuando quieras.',
    monthly: 'Mensual', annual: 'Anual', save: 'Ahorra 2 meses',
    plans: [
      {
        name: 'Free', badge: '', monthly: '€0', annual: '€0', per: '',
        desc: 'Para conocer el método',
        features: ['1 plan completo con IA','5 fases del Canvas','Sin análisis IA','10 mejoras con IA','Export PDF básico con marca de agua'],
        missing: ['Guardar planes','Calculadora táctica avanzada','Sin marca de agua'],
        cta: 'Empezar gratis', hilight: false, note: 'Sin tarjeta de crédito',
      },
      {
        name: 'Pro', badge: 'Más popular', monthly: '€15', annual: '€120', per: '/mes',
        desc: 'Para profesionales y consultores',
        features: ['10 planes/mes','20 Análisis IA/mes','70 Mejoras IA/mes','Vídeos formativos completos','Calculadora táctica avanzada','Export PDF sin marca de agua','Planes guardados','Soporte prioritario'],
        missing: [],
        cta: 'Activar Pro', hilight: true, note: 'Sin permanencia · Cancela cuando quieras',
      },
      {
        name: 'Business', badge: '', monthly: '€35', annual: '€300', per: '/mes',
        desc: 'Para agencias y equipos',
        features: ['30 planes/mes','60 Análisis IA/mes','150 Mejoras IA/mes','Todo lo de Pro','Sin marca de agua','Soporte chat con IA','Hasta 5 usuarios','Onboarding personalizado'],
        missing: [],
        cta: 'Empezar', hilight: false, note: '€25/mes facturado anual',
      },
      {
        name: 'Enterprise', badge: '', monthly: '€99', annual: '€840', per: '/mes',
        desc: 'Para escuelas y grandes equipos',
        features: ['Planes ilimitados','Análisis IA ilimitados','Mejoras IA ilimitadas','Todo lo de Business','Hasta 10 usuarios','Whitelabel — tu marca','SLA garantizado','Factura B2B / prepago'],
        missing: [],
        cta: 'Contactar', hilight: false, note: '€70/mes facturado anual',
      },
    ],
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      { q:'¿Necesito saber marketing?', a:'El Canvas te guía paso a paso. Jaime explica cada fase en vídeo. Si tienes una empresa o idea de negocio, puedes crear un plan profesional desde el primer día.' },
      { q:'¿Qué hace la IA exactamente?', a:'Analiza tu mercado, genera el DAFO, construye el buyer persona completo, sugiere canales y crea la estrategia. Todo editable.' },
      { q:'¿El plan es editable?', a:'Todo es editable. La IA es el punto de partida — tú lo ajustas, completas y personalizas.' },
      { q:'¿Puedo cancelar?', a:'Sí. Sin permanencia ni penalización. Cancelas en un clic desde tu perfil.' },
      { q:'¿Funciona para cualquier sector?', a:'Sí. La IA adapta el análisis al sector que indiques: B2C, B2B, ecommerce, servicios, formación, startups...' },
      { q:'¿Los vídeos siempre están disponibles?', a:'Sí, desde el plan Pro en adelante. Jaime explica cada fase con teoría y ejemplos prácticos.' },
    ],
    ctaTitle: 'Tu plan de marketing\nestá a 5 pasos.',
    ctaSub: 'Empieza ahora. El primer plan es gratis.',
    ctaBtn: 'Crear mi plan →',
  },
}

export default function LandingPage() {
  const [annual, setAnnual] = useState(false)
  const [faq, setFaq] = useState<number | null>(null)
  const t = T.es

  const S = {
    btn: (hi: boolean): React.CSSProperties => ({
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '11px 22px', borderRadius: 6, fontFamily: "'Geist',sans-serif",
      fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', cursor: 'pointer',
      border: hi ? 'none' : `1px solid ${C.steel1}`,
      background: hi ? C.navy : 'transparent',
      color: hi ? C.paper : C.steel,
      textDecoration: 'none',
    }),
    card: { background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, padding: 24, boxShadow: '0 1px 2px rgba(15,41,66,0.06)' } as React.CSSProperties,
  }

  return (
    <div style={{ background: C.paper, fontFamily: "'Geist',sans-serif", color: C.navy }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(246,244,239,0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.steel1}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <MpcLockup size={28} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {t.navLinks.map((l, i) => (
              <a key={i} href={`#${['how','features','pricing'][i]}`} style={{ fontSize: 14, color: C.steel, textDecoration: 'none', fontWeight: 500 }}>{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/login" style={S.btn(false)}>{t.login}</a>
            <a href="/registro" style={S.btn(true)}>{t.cta}</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, border: `1px solid ${C.steel1}`, background: C.white, color: C.steel, fontSize: 12, fontFamily: "'Geist Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 40 }}>
            <MpcMark size={14} /> {t.badge}
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 'clamp(42px,6vw,76px)', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 28, color: C.navy }}>
            {t.h1a}<br /><em style={{ fontStyle: 'italic', color: C.steel }}>{t.h1b}</em>
          </h1>
          <p style={{ fontSize: 17, color: C.steel, maxWidth: 580, margin: '0 auto 44px', lineHeight: 1.7 }}>{t.sub}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <a href="/registro" style={{ ...S.btn(true), padding: '14px 32px', fontSize: 15 }}>{t.cta1} →</a>
            <a href="#how" style={{ ...S.btn(false), padding: '14px 32px', fontSize: 15 }}>{t.cta2}</a>
          </div>
          <p style={{ fontSize: 12, color: C.steel3 }}>Sin tarjeta de crédito · Bilingüe ES/EN</p>

          {/* Hero canvas preview */}
          <div style={{ marginTop: 72, background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 12, padding: 32, textAlign: 'left', boxShadow: '0 12px 28px -16px rgba(15,41,66,0.15)', maxWidth: 680, margin: '72px auto 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <MpcMark size={28} accentAt="center" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Media Planning Canvas</div>
                <div style={{ fontSize: 11, color: C.steel3, fontFamily: "'Geist Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>Formación y Educación · España</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <div style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, background: '#EEF2FF', color: '#3730A3', fontWeight: 600 }}>B2B</div>
                <div style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, background: '#F0FDF4', color: '#166534', fontWeight: 600 }}>Activo</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
              {['Mercado','Target','Estrategia','Táctico','Resumen'].map((f, i) => (
                <div key={f} style={{ padding: '12px 10px', borderRadius: 6, border: `1px solid ${i < 3 ? C.navy : C.steel1}`, background: i < 3 ? C.navy : C.white, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontFamily: "'Geist Mono',monospace", letterSpacing: '0.1em', color: i < 3 ? 'rgba(246,244,239,0.55)' : C.steel3, textTransform: 'uppercase', marginBottom: 4 }}>{String(i+1).padStart(2,'0')}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: i < 3 ? C.paper : C.steel }}>{f}</div>
                  {i < 3 && <div style={{ fontSize: 10, color: '#6EE7B7', marginTop: 4 }}>✓</div>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 6, background: C.paper, border: `1px solid ${C.steel1}`, fontSize: 12, color: C.steel, fontFamily: "'Geist Mono',monospace" }}>
              ◈ IA analizando: Mercado EdTech España · €280M · Crecimiento +18%...
            </div>
          </div>
        </div>
      </section>

      {/* PHASES */}
      <section id="how" style={{ padding: '96px 24px', background: C.white }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.steel3, marginBottom: 14 }}>{t.phasesLabel}</div>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 'clamp(28px,4vw,48px)', color: C.navy, letterSpacing: '-0.02em' }}>{t.phasesTitle}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            {t.phases.map((ph, i) => (
              <div key={i} style={{ background: i === 4 ? C.navy : C.paper, border: `1px solid ${i === 4 ? C.navy : C.steel1}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, letterSpacing: '0.18em', color: i === 4 ? 'rgba(246,244,239,0.5)' : C.steel3, textTransform: 'uppercase', marginBottom: 10 }}>{ph.n}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: i === 4 ? C.paper : C.navy, marginBottom: 8, letterSpacing: '-0.01em' }}>{ph.t}</div>
                <div style={{ fontSize: 13, color: i === 4 ? 'rgba(246,244,239,0.65)' : C.steel, lineHeight: 1.55 }}>{ph.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.steel3, marginBottom: 14 }}>{t.featLabel}</div>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 'clamp(26px,4vw,44px)', color: C.navy, letterSpacing: '-0.02em', marginBottom: 12 }}>{t.featTitle}</h2>
            <p style={{ fontSize: 16, color: C.steel, maxWidth: 500, margin: '0 auto' }}>{t.featSub}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 1, border: `1px solid ${C.steel1}`, borderRadius: 10, overflow: 'hidden' }}>
            {t.feats.map((f, i) => (
              <div key={i} style={{ background: C.white, padding: '28px 24px', borderRight: i % 2 === 0 ? `1px solid ${C.steel1}` : 'none', borderBottom: i < 4 ? `1px solid ${C.steel1}` : 'none' }}>
                <div style={{ fontSize: 22, color: C.accent, marginBottom: 14, fontWeight: 400 }}>{f.ic}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 8, letterSpacing: '-0.01em' }}>{f.t}</div>
                <div style={{ fontSize: 13, color: C.steel, lineHeight: 1.6 }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section style={{ padding: '96px 24px', background: C.navy }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(246,244,239,0.45)', marginBottom: 20 }}>{t.proofLabel}</div>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 'clamp(26px,3vw,40px)', color: C.paper, letterSpacing: '-0.02em', marginBottom: 20, lineHeight: 1.2, whiteSpace: 'pre-line' }}>{t.proofTitle}</h2>
            <p style={{ fontSize: 15, color: 'rgba(246,244,239,0.65)', lineHeight: 1.7, marginBottom: 32 }}>{t.proofSub}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, color: C.paper, flexShrink: 0 }}>JF</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.paper }}>Jaime Fernández de la Puente-Campano</div>
                <div style={{ fontSize: 12, color: 'rgba(246,244,239,0.55)' }}>Consultor · IE Business School · PeopleXBrand</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {t.stats.map((s, i) => (
              <div key={i} style={{ background: 'rgba(246,244,239,0.06)', border: '1px solid rgba(246,244,239,0.1)', borderRadius: 10, padding: '20px 18px' }}>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontWeight: 500, fontSize: 30, color: C.paper, marginBottom: 6 }}>{s.n}</div>
                <div style={{ fontSize: 12, color: 'rgba(246,244,239,0.55)', lineHeight: 1.4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '96px 24px', background: C.white }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.steel3, marginBottom: 14 }}>{t.pricingLabel}</div>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 'clamp(26px,4vw,44px)', color: C.navy, letterSpacing: '-0.02em', marginBottom: 12 }}>{t.pricingTitle}</h2>
            <p style={{ fontSize: 15, color: C.steel, marginBottom: 28 }}>{t.pricingSub}</p>
            {/* Toggle mensual/anual */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: C.paper, border: `1px solid ${C.steel1}`, borderRadius: 8, padding: 3 }}>
              <button onClick={() => setAnnual(false)} style={{ padding: '7px 18px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: !annual ? C.white : 'transparent', color: !annual ? C.navy : C.steel, boxShadow: !annual ? '0 1px 2px rgba(15,41,66,0.08)' : 'none', transition: 'all 0.2s', fontFamily: "'Geist',sans-serif" }}>{t.monthly}</button>
              <button onClick={() => setAnnual(true)} style={{ padding: '7px 18px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: annual ? C.white : 'transparent', color: annual ? C.navy : C.steel, boxShadow: annual ? '0 1px 2px rgba(15,41,66,0.08)' : 'none', transition: 'all 0.2s', fontFamily: "'Geist',sans-serif" }}>
                {t.annual} <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: '#ECFDF5', color: '#166534', marginLeft: 4, fontFamily: "'Geist Mono',monospace" }}>-17%</span>
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
            {t.plans.map((pl, i) => (
              <div key={i} style={{ background: pl.hilight ? C.navy : C.white, border: `1.5px solid ${pl.hilight ? C.navy : C.steel1}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: pl.hilight ? '0 12px 28px -8px rgba(15,41,66,0.25)' : 'none' }}>
                {pl.badge && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: 999, background: C.accent, color: C.paper, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: "'Geist Mono',monospace", letterSpacing: '0.05em' }}>{pl.badge}</div>}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: pl.hilight ? 'rgba(246,244,239,0.5)' : C.steel3, marginBottom: 8 }}>{pl.name}</div>
                  <div style={{ fontSize: 12, color: pl.hilight ? 'rgba(246,244,239,0.65)' : C.steel, marginBottom: 14 }}>{pl.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontFamily: "'Geist Mono',monospace", fontWeight: 500, fontSize: 38, color: pl.hilight ? C.paper : C.navy, lineHeight: 1 }}>{annual ? pl.annual : pl.monthly}</span>
                    {pl.per && <span style={{ fontSize: 13, color: pl.hilight ? 'rgba(246,244,239,0.55)' : C.steel, paddingBottom: 5 }}>{annual ? '/año' : pl.per}</span>}
                  </div>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 24, flex: 1 }}>
                  {pl.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', gap: 8, fontSize: 13, color: pl.hilight ? 'rgba(246,244,239,0.8)' : C.steel, marginBottom: 8, lineHeight: 1.4 }}>
                      <span style={{ color: pl.hilight ? '#6EE7B7' : '#2F7D5C', flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                    </li>
                  ))}
                  {pl.missing.map((f, j) => (
                    <li key={`m${j}`} style={{ display: 'flex', gap: 8, fontSize: 13, color: pl.hilight ? 'rgba(246,244,239,0.3)' : C.steel3, marginBottom: 8 }}>
                      <span style={{ flexShrink: 0 }}>✗</span>{f}
                    </li>
                  ))}
                </ul>
                <div>
                  <a href={pl.name === 'Enterprise' ? 'mailto:hola@mediaplanningcanvas.com' : '/registro'}
                    style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: 8, background: pl.hilight ? C.paper : C.navy, color: pl.hilight ? C.navy : C.paper, fontWeight: 600, fontSize: 13, textDecoration: 'none', transition: 'opacity 0.2s', fontFamily: "'Geist',sans-serif" }}>
                    {pl.cta}
                  </a>
                  <p style={{ fontSize: 11, color: pl.hilight ? 'rgba(246,244,239,0.4)' : C.steel3, textAlign: 'center', marginTop: 8, fontFamily: "'Geist Mono',monospace" }}>{pl.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 36, color: C.navy, textAlign: 'center', marginBottom: 44, letterSpacing: '-0.02em' }}>{t.faqTitle}</h2>
          {t.faqs.map((item, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${C.steel1}`, overflow: 'hidden' }}>
              <button onClick={() => setFaq(faq === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'Geist',sans-serif" }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: C.navy }}>{item.q}</span>
                <span style={{ color: C.steel3, fontSize: 20, transform: faq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: 16 }}>+</span>
              </button>
              {faq === i && <div style={{ paddingBottom: 18, fontSize: 14, color: C.steel, lineHeight: 1.7 }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section style={{ padding: '96px 24px', background: C.paper2, textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <MpcMark size={48} accentAt="center" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 'clamp(28px,4vw,48px)', color: C.navy, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.15, whiteSpace: 'pre-line' }}>{t.ctaTitle}</h2>
          <p style={{ fontSize: 16, color: C.steel, marginBottom: 32 }}>{t.ctaSub}</p>
          <a href="/registro" style={{ ...S.btn(true), padding: '14px 36px', fontSize: 15, margin: '0 auto' }}>{t.ctaBtn}</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.steel1}`, padding: '36px 24px', background: C.white }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <MpcLockup size={24} />
          <div style={{ display: 'flex', gap: 24 }}>
            {['Aviso Legal', 'Privacidad', 'Cookies', 'Contacto'].map((l, i) => (
              <a key={i} href="#" style={{ fontSize: 12, color: C.steel3, textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.steel3, fontFamily: "'Geist Mono',monospace" }}>© {new Date().getFullYear()} MPC</p>
        </div>
      </footer>
    </div>
  )
}
