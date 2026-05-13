'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const P = { bg:'#07090f', card:'#111826', border:'#1e2d45', acc:'#0ea5e9', txt:'#f0f6ff', txt2:'#94a3b8', txt3:'#3d5370' }
const INP: React.CSSProperties = { width:'100%', background:'#0d1117', border:`1px solid ${P.border}`, borderRadius:10, padding:'11px 14px', color:P.txt, fontSize:14, outline:'none', display:'block', marginBottom:14, boxSizing:'border-box' }

export default function RegistroPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  async function handleFree(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password || !name) { setError('Rellena todos los campos'); return }
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
    const res = await fetch('/api/create-checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email }) })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { setError('Error al iniciar el pago.'); setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:P.bg, position:'relative', zIndex:1 }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <a href="/" style={{ display:'block', textAlign:'center', marginBottom:28, textDecoration:'none', fontSize:13, color:P.txt2 }}>← Media Planning Canvas</a>
        <div style={{ background:P.card, border:`1px solid ${P.border}`, borderRadius:20, padding:36 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:20, color:'#000', margin:'0 auto 18px' }}>M</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24, color:P.txt, textAlign:'center', marginBottom:6 }}>Empieza gratis</h1>
          <p style={{ fontSize:13, color:P.txt2, textAlign:'center', marginBottom:26 }}>1 plan completo incluido · Sin tarjeta</p>
          {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#f87171', marginBottom:14 }}>⚠️ {error}</div>}
          {success && <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#34d399', marginBottom:14 }}>✅ {success}</div>}
          <form onSubmit={handleFree}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:P.txt2, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Nombre completo</label>
            <input style={INP} type="text" placeholder="Ana García" value={name} onChange={e=>setName(e.target.value)} />
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:P.txt2, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Email</label>
            <input style={INP} type="email" placeholder="ana@empresa.com" value={email} onChange={e=>setEmail(e.target.value)} />
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:P.txt2, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Contraseña</label>
            <input style={INP} type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e=>setPassword(e.target.value)} />
            <div style={{ background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#34d399', marginBottom:3 }}>✓ Plan Gratuito incluye:</div>
              <div style={{ fontSize:12, color:P.txt2 }}>1 plan completo · 5 fases · IA básica · Vídeos · Export PDF</div>
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:13, borderRadius:10, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', border:'none', color:'#000', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              {loading ? 'Creando...' : 'Crear cuenta gratis →'}
            </button>
          </form>
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
            <div style={{ flex:1, height:1, background:P.border }} /><span style={{ fontSize:12, color:P.txt3 }}>o activa Pro</span><div style={{ flex:1, height:1, background:P.border }} />
          </div>
          <div style={{ background:'rgba(14,165,233,0.06)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
              <span style={{ fontSize:13, fontWeight:700, color:P.txt }}>Pro</span>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:P.acc, fontSize:14 }}>€15/mes</span>
            </div>
            <div style={{ fontSize:12, color:P.txt2 }}>Planes ilimitados · IA avanzada · 20+ horas · 7 días gratis</div>
          </div>
          <button onClick={handlePro} disabled={loading} style={{ width:'100%', padding:13, borderRadius:10, background:'transparent', border:`1px solid ${P.border}`, color:P.txt2, fontWeight:600, fontSize:14, cursor:'pointer' }}>
            {loading ? 'Redirigiendo...' : '⭐ Empezar 7 días gratis — Pro'}
          </button>
          <p style={{ textAlign:'center', fontSize:12, color:P.txt3, marginTop:18 }}>
            ¿Ya tienes cuenta? <a href="/login" style={{ color:P.acc, textDecoration:'none' }}>Entrar</a>
          </p>
        </div>
      </div>
    </div>
  )
}
