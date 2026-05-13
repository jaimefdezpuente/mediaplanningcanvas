'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { MpcMark } from '@/lib/MpcLogo'

const C = { paper:'#F6F4EF', navy:'#0F2942', steel:'#4A6B8A', steel1:'#DDE2E8', steel3:'#8AA0B5', accent:'#C75A3C', white:'#FFFFFF' }
const INP: React.CSSProperties = { width:'100%', background:C.white, border:`1px solid ${C.steel1}`, borderRadius:6, padding:'11px 14px', color:C.navy, fontSize:15, outline:'none', display:'block', marginBottom:14, boxSizing:'border-box', fontFamily:"'Geist',sans-serif" }
const LBL: React.CSSProperties = { display:'block', fontSize:11, fontWeight:600, color:C.steel3, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6, fontFamily:"'Geist Mono',monospace" }

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Rellena todos los campos'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('Email o contraseña incorrectos'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', background:C.paper, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'Geist',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <a href="/" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:32, textDecoration:'none' }}>
          <MpcMark size={22} />
          <span style={{ fontSize:13, color:C.steel, fontWeight:500 }}>Media Planning Canvas</span>
        </a>
        <div style={{ background:C.white, border:`1px solid ${C.steel1}`, borderRadius:12, padding:36, boxShadow:'0 4px 12px rgba(15,41,66,0.08)' }}>
          <h1 style={{ fontSize:22, fontWeight:600, color:C.navy, marginBottom:4, letterSpacing:'-0.02em' }}>Bienvenido de vuelta</h1>
          <p style={{ fontSize:11, color:C.steel3, marginBottom:28, fontFamily:"'Geist Mono',monospace", letterSpacing:'0.05em', textTransform:'uppercase' }}>Accede a tus planes</p>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:6, padding:'10px 14px', fontSize:13, color:'#B33A2E', marginBottom:16 }}>⚠️ {error}</div>}
          <form onSubmit={handleLogin}>
            <label style={LBL}>Email</label>
            <input style={INP} type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
            <label style={LBL}>Contraseña</label>
            <input style={INP} type="password" placeholder="Tu contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:6, background:C.navy, border:'none', color:C.paper, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:"'Geist',sans-serif", marginTop:4 }}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>
          <p style={{ textAlign:'center', fontSize:13, color:C.steel3, marginTop:20 }}>
            ¿No tienes cuenta? <a href="/registro" style={{ color:C.navy, textDecoration:'none', fontWeight:600 }}>Empieza gratis</a>
          </p>
        </div>
      </div>
    </div>
  )
}
