'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { MpcLockup } from '@/lib/MpcLogo'
import { useRouter, useSearchParams } from 'next/navigation'

const C = {
  paper: '#F6F4EF', paper2: '#ECE8DF',
  navy: '#0F2942', navy7: '#163659',
  steel: '#4A6B8A', steel1: '#DDE2E8', steel3: '#8AA0B5',
  accent: '#C75A3C', white: '#FFFFFF',
  success: '#2F7D5C', err: '#B33A2E',
}
const INP: React.CSSProperties = { width: '100%', background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 6, padding: '11px 14px', color: C.navy, fontSize: 15, outline: 'none', display: 'block', marginBottom: 6, boxSizing: 'border-box', fontFamily: "'Geist',sans-serif" }
const LBL: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, marginTop: 16, fontFamily: "'Geist Mono',monospace" }
const CARD: React.CSSProperties = { background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 12, padding: 28, marginBottom: 20, boxShadow: '0 1px 2px rgba(15,41,66,0.05)' }
const BTN_P: React.CSSProperties = { padding: '11px 24px', borderRadius: 6, background: C.navy, border: 'none', color: C.paper, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Geist',sans-serif" }
const BTN_S: React.CSSProperties = { padding: '11px 18px', borderRadius: 6, background: 'transparent', border: `1px solid ${C.steel1}`, color: C.steel, fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: "'Geist',sans-serif" }

const PLANS = [
  { key: 'free', name: 'Free', price: '€0', desc: '1 plan · 10 repensares · PDF básico' },
  { key: 'pro', name: 'Pro', price: '€15/mes', desc: '10 planes · 70 repensares · Sin marca de agua', stripe: 'pro_monthly' },
  { key: 'pro_annual', name: 'Pro Anual', price: '€120/año', desc: 'Todo Pro · 2 meses gratis', stripe: 'pro_annual' },
  { key: 'business', name: 'Business', price: '€35/mes', desc: '30 planes · 150 repensares · 5 usuarios', stripe: 'business_monthly' },
]

export default function PerfilPage() {
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [tab, setTab] = useState('perfil')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Profile fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Password fields
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) setTab(tabParam)
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      setName(user.user_metadata?.full_name || '')
      setEmail(user.email || '')
      setLoading(false)
    }
    load()
  }, [])

  function showMsg(type: 'ok' | 'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      email: email !== user?.email ? email : undefined,
      data: { full_name: name }
    })
    if (error) showMsg('err', error.message)
    else showMsg('ok', email !== user?.email ? 'Perfil guardado. Revisa tu nuevo email para confirmarlo.' : 'Perfil actualizado correctamente.')
    setSaving(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwNew !== pwConfirm) { showMsg('err', 'Las contraseñas no coinciden'); return }
    if (pwNew.length < 8) { showMsg('err', 'La contraseña debe tener al menos 8 caracteres'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwNew })
    if (error) showMsg('err', error.message)
    else { showMsg('ok', 'Contraseña actualizada correctamente.'); setPwCurrent(''); setPwNew(''); setPwConfirm('') }
    setSaving(false)
  }

  async function handleUpgrade(planKey: string) {
    if (!user?.email) return
    setSaving(true)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, plan: planKey })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { showMsg('err', 'Error al iniciar el pago. Inténtalo de nuevo.'); setSaving(false) }
  }

  async function openStripePortal() {
    if (!user?.email) return
    setSaving(true)
    try {
      const res = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showMsg('err', data.error || 'Error al abrir el portal.')
    } catch {
      showMsg('err', 'Error al conectar con Stripe.')
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.steel, fontSize: 14 }}>Cargando...</div>
    </div>
  )

  const currentPlan = user?.user_metadata?.plan || 'free'
  const isPro = currentPlan !== 'free'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  const TABS = [
    { key: 'perfil', label: 'Mi perfil' },
    { key: 'password', label: 'Contraseña' },
    { key: 'plan', label: 'Plan y facturación' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.paper, fontFamily: "'Geist',sans-serif", color: C.navy }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.steel1}`, boxShadow: '0 1px 2px rgba(15,41,66,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <MpcLockup size={24} />
          <a href="/dashboard" style={{ fontSize: 13, color: C.steel, textDecoration: 'none', fontWeight: 500 }}>← Dashboard</a>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* User summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.navy, color: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 20, flexShrink: 0 }}>{initials}</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 2, letterSpacing: '-0.02em' }}>{name || email}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: C.steel }}>{user?.email}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: isPro ? C.navy : C.paper2, color: isPro ? C.paper : C.steel, fontFamily: "'Geist Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{currentPlan}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.steel1}`, marginBottom: 28 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? C.navy : C.steel, borderBottom: `2px solid ${tab === t.key ? C.navy : 'transparent'}`, fontFamily: "'Geist',sans-serif", transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Message */}
        {msg && (
          <div style={{ background: msg.type === 'ok' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${msg.type === 'ok' ? '#BBF7D0' : '#FECACA'}`, borderRadius: 8, padding: '10px 16px', fontSize: 14, color: msg.type === 'ok' ? C.success : C.err, marginBottom: 20 }}>
            {msg.type === 'ok' ? '✓' : '⚠️'} {msg.text}
          </div>
        )}

        {/* ── TAB: PERFIL ── */}
        {tab === 'perfil' && (
          <form onSubmit={saveProfile}>
            <div style={CARD}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: C.navy, marginBottom: 4, letterSpacing: '-0.01em' }}>Información personal</h2>
              <p style={{ fontSize: 13, color: C.steel3, marginBottom: 20 }}>Actualiza tu nombre y email de acceso.</p>
              <label style={LBL}>Nombre completo</label>
              <input style={INP} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre completo" />
              <label style={LBL}>Email</label>
              <input style={INP} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
              {email !== user?.email && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: C.accent, marginTop: 6 }}>
                  ⚠️ Al cambiar el email recibirás un enlace de confirmación en la nueva dirección.
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="submit" style={BTN_P} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </div>
          </form>
        )}

        {/* ── TAB: PASSWORD ── */}
        {tab === 'password' && (
          <form onSubmit={changePassword}>
            <div style={CARD}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: C.navy, marginBottom: 4, letterSpacing: '-0.01em' }}>Cambiar contraseña</h2>
              <p style={{ fontSize: 13, color: C.steel3, marginBottom: 20 }}>Usa una contraseña de al menos 8 caracteres.</p>
              <label style={LBL}>Contraseña nueva</label>
              <input style={INP} type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Mínimo 8 caracteres" />
              <label style={LBL}>Confirmar contraseña nueva</label>
              <input style={INP} type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Repite la contraseña" />
              {pwNew && pwConfirm && pwNew !== pwConfirm && (
                <div style={{ fontSize: 12, color: C.err, marginTop: 4 }}>Las contraseñas no coinciden</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="submit" style={BTN_P} disabled={saving || !pwNew || !pwConfirm}>{saving ? 'Guardando...' : 'Cambiar contraseña'}</button>
              </div>
            </div>
          </form>
        )}

        {/* ── TAB: PLAN ── */}
        {tab === 'plan' && (
          <div>
            {/* Current plan */}
            <div style={{ ...CARD, background: '#F0F9FF', border: '1.5px solid #BAE6FD' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Geist Mono',monospace", marginBottom: 6 }}>Tu plan actual</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 4, textTransform: 'capitalize' }}>{currentPlan}</div>
                  <div style={{ fontSize: 14, color: C.steel }}>
                    {currentPlan === 'free' && '1 plan · 10 repensares · PDF básico con marca de agua'}
                    {currentPlan === 'pro' && '10 planes/mes · 70 repensares · Sin marca de agua · Vídeos'}
                    {currentPlan === 'business' && '30 planes/mes · 150 repensares · 5 usuarios · Sin marca de agua'}
                    {currentPlan === 'enterprise' && 'Planes ilimitados · Todos los usuarios · Whitelabel'}
                  </div>
                </div>
                {isPro && (
                  <button onClick={openStripePortal} style={BTN_S}>Gestionar suscripción →</button>
                )}
              </div>
            </div>

            {/* Upgrade options */}
            {currentPlan === 'free' && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 14 }}>Actualizar tu plan</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                  {PLANS.filter(p => p.key !== 'free').map(p => (
                    <div key={p.key} style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Geist Mono',monospace", marginBottom: 6 }}>{p.name}</div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 6, fontFamily: "'Geist Mono',monospace" }}>{p.price}</div>
                      <div style={{ fontSize: 13, color: C.steel, lineHeight: 1.5, marginBottom: 16, flex: 1 }}>{p.desc}</div>
                      <button onClick={() => p.stripe && handleUpgrade(p.stripe)} style={{ ...BTN_P, width: '100%', textAlign: 'center' as const, justifyContent: 'center' }} disabled={saving}>
                        {saving ? '...' : 'Activar →'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isPro && (
              <div style={CARD}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 6 }}>Facturas y pagos</h3>
                <p style={{ fontSize: 13, color: C.steel, marginBottom: 16 }}>Accede al portal de Stripe para ver tus facturas, cambiar el método de pago o cancelar la suscripción.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={openStripePortal} style={BTN_P}>Ver facturas en Stripe →</button>
                  <button onClick={openStripePortal} style={BTN_S}>Cancelar suscripción</button>
                </div>
                <p style={{ fontSize: 12, color: C.steel3, marginTop: 12 }}>* Serás redirigido al portal seguro de Stripe para gestionar tu suscripción.</p>
              </div>
            )}

            {/* Danger zone */}
            <div style={{ ...CARD, border: '1px solid #FECACA' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.err, marginBottom: 6 }}>Zona de peligro</h3>
              <p style={{ fontSize: 13, color: C.steel, marginBottom: 16 }}>Eliminar tu cuenta es permanente. Perderás todos tus planes y datos.</p>
              <button onClick={() => { if (confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) { /* TODO: delete account */ } }}
                style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: C.err, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Geist',sans-serif" }}>
                Eliminar mi cuenta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
