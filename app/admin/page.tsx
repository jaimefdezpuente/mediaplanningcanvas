'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'

const C = {
  paper: '#F6F4EF', paper2: '#ECE8DF',
  navy: '#0F2942', steel: '#4A6B8A', steel1: '#DDE2E8', steel3: '#8AA0B5',
  white: '#FFFFFF', success: '#2F7D5C', warn: '#C28840', danger: '#B33A2E',
}
const PLAN_COLORS: Record<string, string> = {
  free: '#64748B', pro: '#0284C7', business: '#2F7D5C', enterprise: '#7C3AED'
}
const PLAN_LIMITS: Record<string, { analisis: number; mejoras: number }> = {
  free: { analisis: 3, mejoras: 10 },
  pro:  { analisis: 20, mejoras: 70 },
  business: { analisis: 60, mejoras: 150 },
  enterprise: { analisis: 999, mejoras: 999 },
}

interface User {
  id: string; email: string; full_name: string; plan: string
  used_analisis: number; used_mejoras: number; used_plans: number
  plan_period_start: string | null; created_at: string
  last_sign_in: string; confirmed: boolean; plan_count: number
}

const INP: React.CSSProperties = { width: '100%', background: '#fff', border: `1px solid ${C.steel1}`, borderRadius: 6, padding: '9px 12px', color: C.navy, fontSize: 14, outline: 'none', fontFamily: "'Geist',sans-serif", boxSizing: 'border-box' }
const BTN  = (hi: boolean, danger?: boolean): React.CSSProperties => ({ padding: '9px 18px', borderRadius: 6, border: danger ? '1px solid #FECACA' : hi ? 'none' : `1px solid ${C.steel1}`, background: danger ? '#FEF2F2' : hi ? C.navy : 'transparent', color: danger ? C.danger : hi ? C.paper : C.steel, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist',sans-serif" })
const LBL:  React.CSSProperties = { fontSize: 11, fontWeight: 600, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: "'Geist Mono',monospace" }

function planDaysLeft(start: string | null) {
  if (!start) return null
  const d = new Date(start), now = new Date()
  const next = new Date(d)
  while (next <= now) next.setMonth(next.getMonth() + 1)
  return Math.ceil((next.getTime() - now.getTime()) / 86400000)
}

export default function AdminPage() {
  const [secret, setSecret]       = useState('')
  const [authed, setAuthed]       = useState(false)
  const [users, setUsers]         = useState<User[]>([])
  const [filtered, setFiltered]   = useState<User[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [stats, setStats]         = useState({ totalUsers: 0, totalPlans: 0 })
  const [editUser, setEditUser]   = useState<User | null>(null)
  const [editPlan, setEditPlan]   = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [msg, setMsg]             = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [saving, setSaving]       = useState(false)

  async function login() {
    setLoading(true)
    const res = await fetch('/api/admin?action=stats', { headers: { 'x-admin-secret': secret } })
    if (res.ok) { setStats(await res.json()); setAuthed(true); loadUsers() }
    else setMsg('Contraseña incorrecta')
    setLoading(false)
  }

  async function loadUsers() {
    setLoading(true)
    const res  = await fetch('/api/admin', { headers: { 'x-admin-secret': secret } })
    const data = await res.json()
    if (data.users) { setUsers(data.users); setFiltered(data.users) }
    setLoading(false)
  }

  useEffect(() => {
    let f = users
    if (search) f = f.filter(u => u.email?.toLowerCase().includes(search) || u.full_name?.toLowerCase().includes(search))
    if (filterPlan !== 'all') f = f.filter(u => u.plan === filterPlan)
    setFiltered(f)
  }, [search, filterPlan, users])

  async function patchUser(extra?: { resetCredits?: boolean }) {
    if (!editUser) return
    setSaving(true)
    const body: Record<string, unknown> = { userId: editUser.id, ...extra }
    if (editPlan !== editUser.plan) body.plan = editPlan
    if (editEmail !== editUser.email) body.email = editEmail
    const res = await fetch('/api/admin', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify(body) })
    if (res.ok) {
      await loadUsers()
      setMsg(extra?.resetCredits ? 'Créditos reiniciados ✓' : 'Usuario actualizado ✓')
      if (!extra?.resetCredits) setEditUser(null)
    } else setMsg('Error al actualizar')
    setSaving(false)
  }

  async function confirmUserEmail(userId: string, email: string) {
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ userId, confirmEmail: true })
    })
    if (res.ok) {
      setMsg(`✓ Email confirmado: ${email}`)
      setUsers(u => u.map(x => x.id === userId ? { ...x, confirmed: true } : x))
    } else {
      setMsg('Error al confirmar email')
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`¿Eliminar ${email}? Esto es irreversible.`)) return
    const res = await fetch('/api/admin', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify({ userId }) })
    if (res.ok) { setUsers(u => u.filter(x => x.id !== userId)); setMsg(`${email} eliminado`) }
  }

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Geist',sans-serif" }}>
      <div style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 12, padding: 40, maxWidth: 380, width: '90%', boxShadow: '0 4px 12px rgba(15,41,66,0.1)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40" height="40" style={{ marginBottom: 16, display: 'block' }}>
          <rect x="0" y="0" width="30" height="30" rx="3" fill="#0F2942" opacity="1"/><rect x="35" y="0" width="30" height="30" rx="3" fill="#0F2942" opacity="0.42"/><rect x="70" y="0" width="30" height="30" rx="3" fill="#0F2942" opacity="0.16"/>
          <rect x="0" y="35" width="30" height="30" rx="3" fill="#0F2942" opacity="0.16"/><rect x="35" y="35" width="30" height="30" rx="3" fill="#0F2942" opacity="1"/><rect x="70" y="35" width="30" height="30" rx="3" fill="#0F2942" opacity="0.42"/>
          <rect x="0" y="70" width="30" height="30" rx="3" fill="#0F2942" opacity="0.16"/><rect x="35" y="70" width="30" height="30" rx="3" fill="#0F2942" opacity="0.16"/><rect x="70" y="70" width="30" height="30" rx="3" fill="#0F2942" opacity="1"/>
        </svg>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 4 }}>Panel de Administración</h1>
        <p style={{ fontSize: 13, color: C.steel, marginBottom: 24 }}>Media Planning Canvas</p>
        {msg && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: C.danger, marginBottom: 14 }}>{msg}</div>}
        <input style={{ ...INP, marginBottom: 14 }} type="password" placeholder="Contraseña de administrador" value={secret} onChange={e => setSecret(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
        <button onClick={login} style={{ ...BTN(true), width: '100%' }} disabled={loading}>{loading ? 'Accediendo...' : 'Entrar →'}</button>
      </div>
    </div>
  )

  const planBreakdown = ['free', 'pro', 'business', 'enterprise'].map(p => ({ plan: p, count: users.filter(u => u.plan === p).length }))

  return (
    <div style={{ minHeight: '100vh', background: C.paper, fontFamily: "'Geist',sans-serif", color: C.navy }}>

      {/* Modal edición usuario */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,41,66,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 32, maxWidth: 460, width: '100%', boxShadow: '0 20px 40px rgba(15,41,66,0.2)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 4 }}>Editar usuario</h3>
            <p style={{ fontSize: 13, color: C.steel, marginBottom: 20 }}>{editUser.email}</p>

            <label style={LBL}>Email</label>
            <input style={{ ...INP, marginBottom: 16 }} type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />

            <label style={LBL}>Plan</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {(['free', 'pro', 'business', 'enterprise'] as const).map(p => (
                <button key={p} onClick={() => setEditPlan(p)} style={{
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: "'Geist',sans-serif",
                  border: editPlan === p ? `2px solid ${PLAN_COLORS[p]}` : `1px solid ${C.steel1}`,
                  background: editPlan === p ? PLAN_COLORS[p] + '18' : C.white,
                  color: editPlan === p ? PLAN_COLORS[p] : C.steel,
                  fontWeight: editPlan === p ? 600 : 400,
                  fontSize: 14, textTransform: 'capitalize', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>{p}</span>
                  <span style={{ fontSize: 11, opacity: 0.7, fontFamily: "'Geist Mono',monospace" }}>
                    {p === 'enterprise' ? '∞' : PLAN_LIMITS[p].analisis} IA
                  </span>
                </button>
              ))}
            </div>

            {/* Uso actual de créditos */}
            <div style={{ background: C.paper, border: `1px solid ${C.steel1}`, borderRadius: 8, padding: '12px 14px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: C.steel3, marginBottom: 4, fontFamily: "'Geist Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Análisis IA</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, fontFamily: "'Geist Mono',monospace" }}>
                  {editUser.used_analisis}<span style={{ fontSize: 13, color: C.steel3, fontWeight: 400 }}>/{editUser.plan === 'enterprise' ? '∞' : PLAN_LIMITS[editUser.plan]?.analisis ?? '?'}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.steel3, marginBottom: 4, fontFamily: "'Geist Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mejoras IA</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, fontFamily: "'Geist Mono',monospace" }}>
                  {editUser.used_mejoras}<span style={{ fontSize: 13, color: C.steel3, fontWeight: 400 }}>/{editUser.plan === 'enterprise' ? '∞' : PLAN_LIMITS[editUser.plan]?.mejoras ?? '?'}</span>
                </div>
              </div>
              {editUser.plan_period_start && (
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: C.steel3, marginBottom: 2, fontFamily: "'Geist Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Próxima recarga</div>
                  <div style={{ fontSize: 13, color: C.steel }}>
                    en {planDaysLeft(editUser.plan_period_start)} días
                    <span style={{ fontSize: 11, color: C.steel3, marginLeft: 8 }}>
                      (inicio: {new Date(editUser.plan_period_start).toLocaleDateString('es-ES')})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setEditUser(null)} style={{ ...BTN(false) }}>Cancelar</button>
              <button onClick={() => patchUser({ resetCredits: true })} style={{ ...BTN(false), color: C.warn, borderColor: C.warn }} disabled={saving}>
                ↺ Reset créditos
              </button>
              {!editUser?.confirmed && (
                <button onClick={async () => { await confirmUserEmail(editUser!.id, editUser!.email); setEditUser(null) }} style={{ ...BTN(false), color: C.success, borderColor: C.success }} disabled={saving}>
                  ✓ Confirmar email
                </button>
              )}
              <button onClick={() => patchUser()} style={{ ...BTN(true), flex: 1 }} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.steel1}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="28" height="28">
            <rect x="0" y="0" width="30" height="30" rx="3" fill="#0F2942" opacity="1"/><rect x="35" y="0" width="30" height="30" rx="3" fill="#0F2942" opacity="0.42"/><rect x="70" y="0" width="30" height="30" rx="3" fill="#0F2942" opacity="0.16"/>
            <rect x="0" y="35" width="30" height="30" rx="3" fill="#0F2942" opacity="0.16"/><rect x="35" y="35" width="30" height="30" rx="3" fill="#0F2942" opacity="1"/><rect x="70" y="35" width="30" height="30" rx="3" fill="#0F2942" opacity="0.42"/>
            <rect x="0" y="70" width="30" height="30" rx="3" fill="#0F2942" opacity="0.16"/><rect x="35" y="70" width="30" height="30" rx="3" fill="#0F2942" opacity="0.16"/><rect x="70" y="70" width="30" height="30" rx="3" fill="#0F2942" opacity="1"/>
          </svg>
          <span style={{ fontWeight: 600, fontSize: 15, color: C.navy }}>Admin — Media Planning Canvas</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: 13, color: C.steel, textDecoration: 'none' }}>← Dashboard</a>
          <button onClick={loadUsers} style={{ ...BTN(false) }} disabled={loading}>{loading ? '⏳' : '↺ Recargar'}</button>
        </div>
      </header>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 24px' }}>

        {msg && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: C.success, marginBottom: 20 }}>✓ {msg}</div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Usuarios', value: stats.totalUsers, color: C.navy },
            { label: 'Planes creados', value: stats.totalPlans, color: C.navy },
            ...planBreakdown.map(p => ({ label: p.plan.charAt(0).toUpperCase() + p.plan.slice(1), value: p.count, color: PLAN_COLORS[p.plan] }))
          ].map((s, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Geist Mono',monospace", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: s.color, fontFamily: "'Geist Mono',monospace" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...INP, flex: 1, minWidth: 200 }} placeholder="Buscar email o nombre..." value={search} onChange={e => setSearch(e.target.value.toLowerCase())} />
          <select style={{ ...INP, width: 'auto', cursor: 'pointer' }} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
            <option value="all">Todos los planes</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <span style={{ fontSize: 13, color: C.steel3, padding: '0 8px' }}>{filtered.length} usuarios</span>
        </div>

        {/* Tabla */}
        <div style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.paper, borderBottom: `1px solid ${C.steel1}` }}>
                {['Usuario', 'Plan', 'Análisis IA', 'Mejoras IA', 'Planes', 'Acceso', 'Estado', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Geist Mono',monospace", whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: C.steel3 }}>Sin resultados</td></tr>
              )}
              {filtered.map((u, i) => {
                const lim = PLAN_LIMITS[u.plan] || PLAN_LIMITS.free
                const aRatio = u.plan === 'enterprise' ? 0 : u.used_analisis / lim.analisis
                const mRatio = u.plan === 'enterprise' ? 0 : u.used_mejoras / lim.mejoras
                return (
                  <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.steel1}` : 'none' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontWeight: 500 }}>{u.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: C.steel3 }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 4, background: PLAN_COLORS[u.plan] + '18', color: PLAN_COLORS[u.plan], textTransform: 'uppercase', fontFamily: "'Geist Mono',monospace" }}>
                        {u.plan}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontSize: 13, fontFamily: "'Geist Mono',monospace", color: aRatio >= 1 ? C.danger : C.navy }}>
                        {u.used_analisis}/{u.plan === 'enterprise' ? '∞' : lim.analisis}
                      </div>
                      {u.plan !== 'enterprise' && (
                        <div style={{ marginTop: 3, height: 3, borderRadius: 2, background: C.steel1, width: 60 }}>
                          <div style={{ height: '100%', borderRadius: 2, background: aRatio >= 1 ? C.danger : aRatio >= 0.7 ? C.warn : PLAN_COLORS[u.plan], width: `${Math.min(aRatio * 100, 100)}%` }} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontSize: 13, fontFamily: "'Geist Mono',monospace", color: mRatio >= 1 ? C.danger : C.navy }}>
                        {u.used_mejoras}/{u.plan === 'enterprise' ? '∞' : lim.mejoras}
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', fontFamily: "'Geist Mono',monospace", color: C.steel }}>{u.plan_count}</td>
                    <td style={{ padding: '11px 14px', color: C.steel3, fontSize: 12 }}>
                      {u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: u.confirmed ? '#F0FDF4' : '#FFFBEB', color: u.confirmed ? C.success : C.warn, fontWeight: 600, fontFamily: "'Geist Mono',monospace" }}>
                        {u.confirmed ? '✓' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => { setEditUser(u); setEditPlan(u.plan); setEditEmail(u.email); setMsg('') }} style={{ padding: '5px 12px', borderRadius: 5, border: `1px solid ${C.steel1}`, background: 'transparent', color: C.steel, fontSize: 12, cursor: 'pointer' }}>
                          Editar
                        </button>
                        {!u.confirmed && (
                          <button onClick={() => confirmUserEmail(u.id, u.email)} style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid #BBF7D0', background: '#F0FDF4', color: C.success, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                            ✓ Confirmar
                          </button>
                        )}
                        <button onClick={() => deleteUser(u.id, u.email)} style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid #FECACA', background: '#FEF2F2', color: C.danger, fontSize: 12, cursor: 'pointer' }}>
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
