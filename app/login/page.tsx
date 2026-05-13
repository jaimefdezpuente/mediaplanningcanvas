'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const P = { bg:'#07090f', card:'#111826', border:'#1e2d45', acc:'#0ea5e9', txt:'#f0f6ff', txt2:'#94a3b8' }
const INP: React.CSSProperties = { width:'100%', background:'#0d1117', border:`1px solid ${P.border}`, borderRadius:10, padding:'11px 14px', color:P.txt, fontSize:14, outline:'none', display:'block', marginBottom:14, boxSizing:'border-box' }

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
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:P.bg, position:'relative', zIndex:1 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <a href="/" style={{ display:'block', textAlign:'center', marginBottom:28, textDecoration:'none', fontSize:13, color:P.txt2 }}>← Media Planning Canvas</a>
        <div style={{ background:P.card, border:`1px solid ${P.border}`, borderRadius:20, padding:36 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:20, color:'#000', margin:'0 auto 18px' }}>M</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24, color:P.txt, textAlign:'center', marginBottom:6 }}>Bienvenido de vuelta</h1>
          <p style={{ fontSize:13, color:P.txt2, textAlign:'center', marginBottom:26 }}>Accede a tus planes de marketing</p>
          {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#f87171', marginBottom:14 }}>⚠️ {error}</div>}
          <form onSubmit={handleLogin}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:P.txt2, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Email</label>
            <input style={INP} type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:P.txt2, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Contraseña</label>
            <input style={INP} type="password" placeholder="Tu contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="submit" disabled={loading} style={{ width:'100%', padding:13, borderRadius:10, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', border:'none', color:'#000', fontWeight:700, fontSize:14, cursor:'pointer', marginTop:4 }}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>
          <p style={{ textAlign:'center', fontSize:12, color:P.txt2, marginTop:18 }}>
            ¿No tienes cuenta? <a href="/registro" style={{ color:P.acc, textDecoration:'none' }}>Empieza gratis</a>
          </p>
        </div>
      </div>
    </div>
  )
}
