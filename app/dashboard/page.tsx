'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { MpcMark, MpcLockup } from '@/lib/MpcLogo'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string; name: string; sector: string; pais: string
  tipo_negocio: string; status: string; created_at: string
}

const C = {
  paper: '#F6F4EF', paper2: '#ECE8DF',
  navy: '#0F2942', navy7: '#163659',
  steel: '#4A6B8A', steel1: '#DDE2E8', steel3: '#8AA0B5',
  accent: '#C75A3C', white: '#FFFFFF',
}

const PLAN_LIMITS: Record<string, { plans: number | string; mejoras: number | string; analisis: number | string }> = {
  free:       { plans: 1,   mejoras: 10,    analisis: 0 },
  pro:        { plans: 10,  mejoras: 70,    analisis: 20 },
  business:   { plans: 30,  mejoras: 150,   analisis: 60 },
  enterprise: { plans: '∞', mejoras: '∞',   analisis: '∞' },
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase.from('plans').select('id,name,sector,pais,tipo_negocio,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false })
      if (data) setPlans(data)
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === 'true') { await supabase.auth.updateUser({ data: { plan: 'pro' } }); window.history.replaceState({}, '', '/dashboard') }
      setLoading(false)
    }
    load()
    function handleClick(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() { await supabase.auth.signOut(); router.push('/') }
  async function handleUpgrade() {
    const email = user?.email
    if (!email) return
    setUpgrading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: 'pro_monthly' })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Error Stripe: ' + (data.error || 'Error desconocido'))
      }
    } catch (e) {
      alert('Error de conexión. Inténtalo de nuevo.')
    }
    setUpgrading(false)
  }
  async function deletePlan(id: string) {
    if (!confirm('¿Eliminar este plan?')) return
    await supabase.from('plans').delete().eq('id', id)
    setPlans(plans.filter(p => p.id !== id))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.steel, fontSize: 14 }}>
        <div style={{ width: 18, height: 18, border: `2px solid ${C.navy}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Cargando...
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const planKey = (user?.user_metadata?.plan || 'free').toLowerCase()
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free
  const isPro = planKey !== 'free'
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const usedPlans = plans.length
  const usedMejoras = Number(user?.user_metadata?.used_mejoras || 0)
  const usedAnalisis = Number(user?.user_metadata?.used_analisis || 0)

  const pct = (used: number, max: number | string) => {
    if (max === '∞') return 100
    return Math.min(100, Math.round(used / Number(max) * 100))
  }

  return (
    <div style={{ minHeight: '100vh', background: C.paper, fontFamily: "'Geist',sans-serif", color: C.navy }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* HEADER */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.steel1}`, position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 2px rgba(15,41,66,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 24 }}>
          <MpcLockup size={26} />

          <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
            <a href="/dashboard" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, color: C.navy, background: C.paper, textDecoration: 'none' }}>Mis planes</a>
            <a href="/plan/nuevo" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, color: C.steel, textDecoration: 'none' }}>+ Nuevo plan</a>
          </nav>

          {/* Credits counter */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* Plans used */}
            <div style={{ display: 'flex', flex: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 80, height: 4, borderRadius: 2, background: C.steel1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: C.navy, width: `${pct(usedPlans, limits.plans)}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 11, color: C.steel, fontFamily: "'Geist Mono',monospace", whiteSpace: 'nowrap' }}>
                  {usedPlans}/{limits.plans} planes
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 80, height: 4, borderRadius: 2, background: C.steel1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: C.navy, width: `${pct(usedAnalisis, limits.analisis)}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 11, color: C.steel, fontFamily: "'Geist Mono',monospace", whiteSpace: 'nowrap' }}>
                  {usedAnalisis}/{limits.analisis} Análisis IA
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 80, height: 4, borderRadius: 2, background: C.steel1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: C.accent, width: `${pct(usedMejoras, limits.mejoras)}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 11, color: C.steel, fontFamily: "'Geist Mono',monospace", whiteSpace: 'nowrap' }}>
                  {usedMejoras}/{limits.mejoras} Mejoras IA
                </span>
              </div>
            </div>

            {/* Plan badge - just informative */}
            <div style={{ padding: '4px 10px', borderRadius: 4, background: isPro ? C.navy : C.paper2, color: isPro ? C.paper : C.steel, fontSize: 11, fontWeight: 600, fontFamily: "'Geist Mono',monospace", letterSpacing: '0.08em', textTransform: 'uppercase', border: isPro ? 'none' : `1px solid ${C.steel1}` }}>
              {planKey}
            </div>

            {/* User menu */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 34, height: 34, borderRadius: '50%', background: C.navy, color: C.paper, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Geist',sans-serif", padding: 0, overflow: 'hidden' }}>
                {user?.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '50%' }} />
                  : initials}
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: 42, background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, boxShadow: '0 8px 24px -8px rgba(15,41,66,0.15)', minWidth: 200, zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.steel1}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{name}</div>
                    <div style={{ fontSize: 11, color: C.steel3 }}>{user?.email}</div>
                  </div>
                  {[
                    { label: 'Editar perfil', href: '/perfil', action: null as (() => void) | null },
                    { label: 'Cambiar contraseña', href: '/perfil?tab=password', action: null as (() => void) | null },
                    { label: 'Facturas', href: '/perfil?tab=plan', action: null as (() => void) | null },
                    { label: isPro ? 'Cambiar de plan' : '⭐ Actualizar a Pro', href: '/perfil?tab=plan', action: null as (() => void) | null },
                  ].map((item, i) => (
                    <a key={i} href={item.href}
                      style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: i === 3 && !isPro ? C.accent : C.navy, textDecoration: 'none', borderBottom: i < 3 ? `1px solid ${C.steel1}` : 'none', fontWeight: i === 3 && !isPro ? 600 : 400 }}>
                      {item.label}
                    </a>
                  ))}
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 13, color: C.steel, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'Geist',sans-serif", borderTop: `1px solid ${C.steel1}` }}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 80px' }}>

        {/* Welcome + intro video */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: C.navy, marginBottom: 4, letterSpacing: '-0.02em' }}>Buenos días, {name.split(' ')[0]} 👋</h1>
            <p style={{ fontSize: 14, color: C.steel }}>{plans.length > 0 ? `${plans.length} plan${plans.length > 1 ? 'es' : ''} guardado${plans.length > 1 ? 's' : ''}` : 'Empieza creando tu primer plan de marketing'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowVideo(!showVideo)} style={{ padding: '9px 16px', borderRadius: 6, border: `1px solid ${C.steel1}`, background: C.white, color: C.steel, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Geist',sans-serif" }}>
              ▶ Introducción a la metodología
            </button>
            <button onClick={() => router.push('/plan/nuevo')} style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: C.navy, color: C.paper, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Geist',sans-serif" }}>
              + Nuevo plan
            </button>
          </div>
        </div>

        {/* Intro video */}
        {showVideo && (
          <div style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, padding: 4, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ position: 'relative', paddingBottom: '40%', height: 0 }}>
              <iframe src="https://player.vimeo.com/video/1103392013?autoplay=1&color=0F2942&title=0&byline=0" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 8 }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
            </div>
          </div>
        )}

        {/* Upgrade banner for free users */}
        {!isPro && (
          <div style={{ background: C.navy, borderRadius: 10, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, color: C.paper, fontSize: 15, marginBottom: 3 }}>Estás en el plan gratuito</div>
              <div style={{ fontSize: 13, color: 'rgba(246,244,239,0.65)' }}>Pasa a Pro y accede a 10 planes/mes, 70 mejoras con IA, vídeos formativos y calculadora táctica avanzada.</div>
            </div>
            <button onClick={handleUpgrade} disabled={upgrading} style={{ padding: '10px 22px', borderRadius: 6, background: C.accent, border: 'none', color: C.paper, fontWeight: 600, fontSize: 13, cursor: upgrading ? 'wait' : 'pointer', whiteSpace: 'nowrap', fontFamily: "'Geist',sans-serif", opacity: upgrading ? 0.7 : 1 }}>
              {upgrading ? 'Redirigiendo...' : 'Actualizar a Pro — Activar Pro →'}
            </button>
          </div>
        )}

        {/* Plans grid */}
        {plans.length === 0 ? (
          <div style={{ background: C.white, border: `2px dashed ${C.steel1}`, borderRadius: 12, padding: 64, textAlign: 'center' }}>
            <MpcMark size={48} style={{ margin: '0 auto 20px', opacity: 0.3 }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Crea tu primer plan de marketing</h2>
            <p style={{ fontSize: 14, color: C.steel, marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>La IA te guiará por las 5 fases del Media Planning Canvas.</p>
            <button onClick={() => router.push('/plan/nuevo')} style={{ padding: '12px 28px', borderRadius: 6, border: 'none', background: C.navy, color: C.paper, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Geist',sans-serif" }}>
              Crear mi primer plan →
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14, marginBottom: 32 }}>
            {plans.map(pl => (
              <div key={pl.id} style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(15,41,66,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, background: pl.status === 'completed' ? '#F0FDF4' : '#FFFBEB', color: pl.status === 'completed' ? '#166534' : '#92400E', fontWeight: 600, fontFamily: "'Geist Mono',monospace", letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {pl.status === 'completed' ? '✓ Completado' : 'En proceso'}
                  </span>
                  <button onClick={() => deletePlan(pl.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.steel3, padding: '2px 6px' }}>✕</button>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 8, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{pl.name}</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {pl.sector && <span style={{ fontSize: 11, color: C.steel, background: C.paper, padding: '2px 8px', borderRadius: 4, border: `1px solid ${C.steel1}` }}>{pl.sector}</span>}
                  {pl.pais && <span style={{ fontSize: 11, color: C.steel, background: C.paper, padding: '2px 8px', borderRadius: 4, border: `1px solid ${C.steel1}` }}>{pl.pais}</span>}
                  {pl.tipo_negocio && <span style={{ fontSize: 11, color: C.navy, background: '#EEF2FF', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{pl.tipo_negocio}</span>}
                </div>
                <div style={{ fontSize: 11, color: C.steel3, marginBottom: 16, fontFamily: "'Geist Mono',monospace" }}>
                  {new Date(pl.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <button onClick={() => router.push(`/plan/${pl.id}`)} style={{ marginTop: 'auto', width: '100%', padding: '10px', borderRadius: 6, background: C.paper, border: `1px solid ${C.steel1}`, color: C.navy, fontWeight: 500, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist',sans-serif" }}>
                  Ver / Continuar →
                </button>
              </div>
            ))}
            <div onClick={() => router.push('/plan/nuevo')} style={{ background: C.paper, border: `2px dashed ${C.steel1}`, borderRadius: 10, minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 8 }}>
              <span style={{ fontSize: 28, color: C.steel3 }}>+</span>
              <span style={{ fontSize: 13, color: C.steel3 }}>Nuevo plan</span>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          {[
            { ic: '▶', t: 'Aprende marketing con vídeos', d: 'No solo creas tu plan — te enseñamos a hacer planes de marketing efectivos', href: '#' },
            { ic: '◈', t: 'Guía del Canvas', d: 'Metodología completa', href: '#' },
          ].map((item, i) => (
            <a key={i} href={item.href}
              style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, padding: '18px 20px', textDecoration: 'none', display: 'block', boxShadow: '0 1px 2px rgba(15,41,66,0.04)' }}>
              <div style={{ fontSize: 18, color: C.accent, marginBottom: 10 }}>{item.ic}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.navy, marginBottom: 4 }}>{item.t}</div>
              <div style={{ fontSize: 12, color: C.steel, lineHeight: 1.5 }}>{item.d}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
