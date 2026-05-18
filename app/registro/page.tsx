'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { MpcMark } from '@/lib/MpcLogo'

const C = { paper:'#F6F4EF', paper2:'#ECE8DF', navy:'#0F2942', steel:'#4A6B8A', steel1:'#DDE2E8', steel3:'#8AA0B5', accent:'#C75A3C', white:'#FFFFFF', success:'#2F7D5C' }
const INP: React.CSSProperties = { width:'100%', background:C.white, border:`1px solid ${C.steel1}`, borderRadius:6, padding:'11px 14px', color:C.navy, fontSize:15, outline:'none', display:'block', marginBottom:14, boxSizing:'border-box', fontFamily:"'Geist',sans-serif" }
const LBL: React.CSSProperties = { display:'block', fontSize:11, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6, fontFamily:"'Geist Mono',monospace" }

export default function RegistroPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<'free'|'pro'>('free')
  const supabase = createClient()

  async function handleFree(e: React.FormEvent) {
    e.preventDefault()
    if (!email||!password||!name) { setError('Rellena todos los campos'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, plan: 'free' } } })
    if (err) { setError(err.message); setLoading(false); return }
    setSuccess('¡Cuenta creada! Revisa tu email para confirmar.')
    setLoading(false)
  }

  async function handlePro() {
    if (!email) { setError('Introduce tu email primero'); return }
    setLoading(true); setError('')
    if (password && name) await supabase.auth.signUp({ email, password, options: { data: { full_name: name, plan: 'pro' } } })
    const res = await fetch('/api/create-checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, plan:'pro_monthly' }) })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { setError('Error al iniciar el pago.'); setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.paper, display:'flex', padding:24, fontFamily:"'Geist',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:900, margin:'auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, background:C.white, borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(15,41,66,0.12)', border:`1px solid ${C.steel1}` }}>

        {/* Left — brand panel */}
        <div style={{ background:C.navy, padding:48, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div>
            <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:48 }}>
              <MpcMark size={28} color="#F6F4EF" />
              <span style={{ fontSize:14, fontWeight:600, color:C.paper }}>Media Planning Canvas</span>
            </a>
            <h2 style={{ fontFamily:"'Instrument Serif',serif", fontWeight:400, fontSize:32, color:C.paper, lineHeight:1.2, letterSpacing:'-0.02em', marginBottom:16 }}>
              El plan de marketing que siempre quisiste crear bajo el método Media Planning Canvas.
            </h2>
            <p style={{ fontSize:14, color:'rgba(246,244,239,0.6)', lineHeight:1.7 }}>
              La metodología que Jaime lleva 10 años enseñando en IE Business School, ahora en tu ordenador con IA.
            </p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              '✓ Metodología probada con +10K descargas',
              '✓ IA entrenada en planificación de marketing',
              '✓ Vídeo píldoras en cada fase',
              '✓ Plan de medios mensualizado y exportable a PDF',
              '✓ +100 canales y medios recomendados',
            ].map((t,i)=>(
              <div key={i} style={{ fontSize:13, color:'rgba(246,244,239,0.75)', display:'flex', alignItems:'flex-start', gap:8 }}>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={{ padding:48 }}>
          <h1 style={{ fontSize:22, fontWeight:600, color:C.navy, marginBottom:4, letterSpacing:'-0.02em' }}>Crea tu cuenta</h1>
          <p style={{ fontSize:11, color:C.steel3, marginBottom:28, fontFamily:"'Geist Mono',monospace", textTransform:'uppercase', letterSpacing:'0.1em' }}>Empieza gratis · Sin tarjeta</p>

          {/* Plan toggle */}
          <div style={{ display:'flex', background:C.paper2, borderRadius:8, padding:3, marginBottom:24, gap:0 }}>
            <button onClick={()=>setTab('free')} style={{ flex:1, padding:'8px', borderRadius:6, border:'none', background:tab==='free'?C.white:'transparent', color:tab==='free'?C.navy:C.steel, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:"'Geist',sans-serif", boxShadow:tab==='free'?'0 1px 2px rgba(15,41,66,0.08)':'none' }}>
              Gratis
            </button>
            <button onClick={()=>setTab('pro')} style={{ flex:1, padding:'8px', borderRadius:6, border:'none', background:tab==='pro'?C.navy:'transparent', color:tab==='pro'?C.paper:C.steel, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>
              Pro · €15/mes
            </button>
          </div>

          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:6, padding:'10px 14px', fontSize:13, color:'#B33A2E', marginBottom:14 }}>⚠️ {error}</div>}
          {success && <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:6, padding:'10px 14px', fontSize:13, color:C.success, marginBottom:14 }}>✓ {success}</div>}

          <form onSubmit={handleFree}>
            <label style={LBL}>Nombre completo</label>
            <input style={INP} type="text" placeholder="Ana García" value={name} onChange={e=>setName(e.target.value)} />
            <label style={LBL}>Email</label>
            <input style={INP} type="email" placeholder="ana@empresa.com" value={email} onChange={e=>setEmail(e.target.value)} />
            <label style={LBL}>Contraseña</label>
            <input style={INP} type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e=>setPassword(e.target.value)} />

            {tab === 'free' ? (
              <div>
                <div style={{ background:C.paper2, borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8, fontFamily:"'Geist Mono',monospace", textTransform:'uppercase', letterSpacing:'0.08em' }}>Plan Free incluye:</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {['1 plan activo','3 Análisis IA de prueba','10 Mejoras IA de prueba','Metodología completa (5 fases)','Calculadora táctica avanzada','Export PDF'].map((f,i)=>(
                      <div key={i} style={{ fontSize:12, color:C.steel, display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ color:C.success, fontSize:10 }}>✓</span>{f}
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:6, background:C.navy, border:'none', color:C.paper, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>
                  {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ background:'#EFF6FF', borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1E3A8A', marginBottom:8, fontFamily:"'Geist Mono',monospace", textTransform:'uppercase', letterSpacing:'0.08em' }}>Plan Pro incluye:</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                    {['10 planes activos','20 Análisis IA/mes','70 Mejoras IA/mes','Vídeo píldoras formativas','Calculadora táctica avanzada','Todos los canales y medios','Export PDF','Soporte prioritario'].map((f,i)=>(
                      <div key={i} style={{ fontSize:12, color:'#1E40AF', display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:10 }}>✓</span>{f}
                      </div>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={handlePro} disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:6, background:C.accent, border:'none', color:C.paper, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>
                  {loading ? 'Redirigiendo...' : 'Empezar Pro →'}
                </button>
              </div>
            )}
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:C.steel3, marginTop:20 }}>
            ¿Ya tienes cuenta? <a href="/login" style={{ color:C.navy, textDecoration:'none', fontWeight:600 }}>Entrar</a>
          </p>
        </div>
      </div>

      {/* Footer legal */}
      <div style={{ width:'100%', maxWidth:900, margin:'24px auto 0', textAlign:'center' }}>
        <p style={{ fontSize:11, color:C.steel3, lineHeight:1.8 }}>
          Al registrarte aceptas la{' '}
          <a href="https://www.mediaplanningcanvas.com/privacidad.html" target="_blank" rel="noopener" style={{ color:C.steel, textDecoration:'underline' }}>Política de Privacidad</a>
          {' '}·{' '}
          <a href="https://www.mediaplanningcanvas.com/aviso-legal.html" target="_blank" rel="noopener" style={{ color:C.steel, textDecoration:'underline' }}>Aviso Legal</a>
          {' '}·{' '}
          <a href="https://www.mediaplanningcanvas.com/cookies.html" target="_blank" rel="noopener" style={{ color:C.steel, textDecoration:'underline' }}>Cookies</a>
          <br />© 2025 Parajitos Voladores SL · NIF B67809624
        </p>
      </div>
    </div>
  )
}
