'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string; name: string; sector: string; pais: string
  tipo_negocio: string; status: string; created_at: string
}

const P = {
  bg: '#ffffff', bg2: '#f8fafc', card: '#ffffff',
  border: '#e2e8f0', acc: '#0284c7', accL: '#eff6ff',
  txt: '#0f172a', txt2: '#475569', txt3: '#94a3b8',
  ok: '#059669', okL: '#f0fdf4', warn: '#d97706',
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string; plan?: string } } | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: plansData } = await supabase
        .from('plans').select('id,name,sector,pais,tipo_negocio,status,created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      if (plansData) setPlans(plansData)

      const params = new URLSearchParams(window.location.search)
      if (params.get('saved') === 'true' || params.get('success') === 'true') {
        if (params.get('success') === 'true') await supabase.auth.updateUser({ data: { plan: 'pro' } })
        window.history.replaceState({}, '', '/dashboard')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleUpgrade() {
    const email = user?.email
    if (!email) return
    const res = await fetch('/api/create-checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  async function deletePlan(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este plan?')) return
    await supabase.from('plans').delete().eq('id', id)
    setPlans(plans.filter(p => p.id !== id))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 16, color: P.txt2 }}>Cargando...</div>
    </div>
  )

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const isPro = user?.user_metadata?.plan === 'pro'

  return (
    <div style={{ minHeight: '100vh', background: P.bg2, fontFamily: '"DM Sans","Inter",system-ui,sans-serif' }}>
      <style>{`body{background:#f8fafc!important}body::before{display:none!important}`}</style>

      {/* HEADER */}
      <div style={{ background: P.card, borderBottom: `1px solid ${P.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#0284c7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>M</div>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, color: P.txt }}>Media Planning Canvas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 14, color: P.txt2 }}>Hola, {name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: isPro ? P.accL : P.okL, color: isPro ? P.acc : P.ok }}>{isPro ? 'PRO' : 'FREE'}</span>
            <a href="/" style={{ fontSize: 13, color: P.txt2, textDecoration: 'none' }}>Inicio</a>
            <button onClick={handleLogout} style={{ fontSize: 13, color: P.txt3, background: 'transparent', border: 'none', cursor: 'pointer' }}>Salir</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 80px' }}>

        {/* UPGRADE BANNER */}
        {!isPro && (
          <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', border: `1.5px solid ${P.acc}`, borderRadius: 14, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: P.txt, fontSize: 15, marginBottom: 3 }}>⭐ Activa Pro — 7 días gratis</div>
              <div style={{ fontSize: 13, color: P.txt2 }}>Planes ilimitados · IA avanzada · 20+ horas de formación en vídeo</div>
            </div>
            <button onClick={handleUpgrade} style={{ padding: '10px 22px', borderRadius: 9, background: P.acc, border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Empezar gratis →
            </button>
          </div>
        )}

        {/* WELCOME + NEW PLAN */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: P.txt, marginBottom: 4 }}>Mis Planes de Marketing</h1>
            <p style={{ fontSize: 15, color: P.txt2 }}>{plans.length > 0 ? `${plans.length} plan${plans.length > 1 ? 'es' : ''} guardado${plans.length > 1 ? 's' : ''}` : 'Crea tu primer plan con la metodología Media Planning Canvas'}</p>
          </div>
          <button onClick={() => router.push('/plan/nuevo')}
            style={{ padding: '12px 24px', borderRadius: 10, background: P.acc, border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            + Nuevo Plan
          </button>
        </div>

        {/* PLANS GRID */}
        {plans.length === 0 ? (
          <div style={{ background: P.card, border: `2px dashed ${P.border}`, borderRadius: 16, padding: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: P.txt, marginBottom: 8 }}>Empieza tu primer plan</h2>
            <p style={{ fontSize: 15, color: P.txt2, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>La IA te guiará por las 5 fases del Media Planning Canvas para crear un plan de marketing completo.</p>
            <button onClick={() => router.push('/plan/nuevo')}
              style={{ padding: '13px 32px', borderRadius: 10, background: P.acc, border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              📊 Crear mi primer plan →
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16, marginBottom: 32 }}>
            {plans.map(pl => (
              <div key={pl.id} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: pl.status === 'completed' ? P.okL : '#fff7ed', color: pl.status === 'completed' ? P.ok : P.warn, textTransform: 'uppercase' }}>
                    {pl.status === 'completed' ? '✓ Completado' : 'En proceso'}
                  </span>
                  <button onClick={() => deletePlan(pl.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: P.txt3, padding: '2px 6px', borderRadius: 4 }}>✕</button>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: P.txt, marginBottom: 6, lineHeight: 1.3 }}>{pl.name}</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {pl.sector && <span style={{ fontSize: 12, color: P.txt2, background: P.bg2, padding: '2px 8px', borderRadius: 4 }}>{pl.sector}</span>}
                  {pl.pais && <span style={{ fontSize: 12, color: P.txt2, background: P.bg2, padding: '2px 8px', borderRadius: 4 }}>{pl.pais}</span>}
                  {pl.tipo_negocio && <span style={{ fontSize: 12, color: P.acc, background: P.accL, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{pl.tipo_negocio}</span>}
                </div>
                <div style={{ fontSize: 12, color: P.txt3, marginBottom: 16 }}>
                  {new Date(pl.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <button onClick={() => router.push(`/plan/${pl.id}`)}
                  style={{ marginTop: 'auto', width: '100%', padding: '10px', borderRadius: 9, background: P.accL, border: `1px solid ${P.acc}`, color: P.acc, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Ver / Continuar →
                </button>
              </div>
            ))}

            {/* New plan card */}
            <div onClick={() => router.push('/plan/nuevo')}
              style={{ background: P.bg2, border: `2px dashed ${P.border}`, borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 180 }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.5 }}>+</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: P.txt2 }}>Nuevo plan</div>
            </div>
          </div>
        )}

        {/* QUICK LINKS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          {[
            { icon: '🎬', title: 'Formación en vídeo', desc: '20+ horas de Jaime explicando cada fase', href: '#' },
            { icon: '📊', title: 'Calculadora Táctica', desc: 'Calcula presupuesto, ROAS y CAC por canal', href: '/calculadora.html' },
            { icon: '📖', title: 'Guía del Canvas', desc: 'Metodología completa Media Planning Canvas', href: '#' },
          ].map((item, i) => (
            <a key={i} href={item.href} target={item.href.includes('http') ? '_blank' : undefined}
              style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '18px 20px', textDecoration: 'none', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: P.txt, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: P.txt2, lineHeight: 1.5 }}>{item.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
