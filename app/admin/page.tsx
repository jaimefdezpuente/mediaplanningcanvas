'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'

const C = {
  paper: '#F6F4EF', paper2: '#ECE8DF',
  navy: '#0F2942', navy7: '#163659',
  steel: '#4A6B8A', steel1: '#DDE2E8', steel3: '#8AA0B5',
  accent: '#C75A3C', white: '#FFFFFF',
  success: '#2F7D5C', warn: '#C28840',
}

interface User {
  id: string; email: string; full_name: string; plan: string
  created_at: string; last_sign_in: string; confirmed: boolean; plan_count: number
}

const PLAN_COLORS: Record<string, string> = {
  free: '#64748B', pro: '#0284C7', business: '#2F7D5C', enterprise: '#7C3AED'
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ totalUsers: 0, totalPlans: 0 })
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editPlan, setEditPlan] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')

  async function login() {
    setLoading(true)
    const res = await fetch('/api/admin?action=stats', { headers: { 'x-admin-secret': secret } })
    if (res.ok) {
      const data = await res.json()
      setStats(data)
      setAuthed(true)
      loadUsers()
    } else {
      setMsg('Contraseña incorrecta')
    }
    setLoading(false)
  }

  async function loadUsers() {
    setLoading(true)
    const res = await fetch('/api/admin', { headers: { 'x-admin-secret': secret } })
    const data = await res.json()
    if (data.users) {
      setUsers(data.users)
      setFiltered(data.users)
    }
    setLoading(false)
  }

  useEffect(() => {
    let f = users
    if (search) f = f.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase()))
    if (filterPlan !== 'all') f = f.filter(u => u.plan === filterPlan)
    setFiltered(f)
  }, [search, filterPlan, users])

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`¿Eliminar el usuario ${email}? Esta acción no se puede deshacer.`)) return
    const res = await fetch('/api/admin', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify({ userId }) })
    if (res.ok) { setUsers(u => u.filter(x => x.id !== userId)); setMsg(`Usuario ${email} eliminado`) }
  }

  async function updateUser() {
    if (!editUser) return
    const res = await fetch('/api/admin', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify({ userId: editUser.id, plan: editPlan || undefined, email: editEmail !== editUser.email ? editEmail : undefined }) })
    if (res.ok) {
      setUsers(u => u.map(x => x.id === editUser.id ? { ...x, plan: editPlan || x.plan, email: editEmail || x.email } : x))
      setMsg('Usuario actualizado')
      setEditUser(null)
    }
  }

  const INP: React.CSSProperties = { width: '100%', background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 6, padding: '9px 12px', color: C.navy, fontSize: 14, outline: 'none', fontFamily: "'Geist',sans-serif", boxSizing: 'border-box' }
  const BTN = (hi: boolean): React.CSSProperties => ({ padding: '9px 18px', borderRadius: 6, border: hi ? 'none' : `1px solid ${C.steel1}`, background: hi ? C.navy : 'transparent', color: hi ? C.paper : C.steel, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'Geist',sans-serif" })

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Geist',sans-serif" }}>
      <div style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 12, padding: 40, maxWidth: 380, width: '90%', boxShadow: '0 4px 12px rgba(15,41,66,0.1)' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 6 }}>Panel de Administración</h1>
        <p style={{ fontSize: 13, color: C.steel, marginBottom: 24 }}>Media Planning Canvas</p>
        {msg && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#B33A2E', marginBottom: 14 }}>{msg}</div>}
        <input style={{ ...INP, marginBottom: 14 }} type="password" placeholder="Contraseña de administrador" value={secret} onChange={e => setSecret(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
        <button onClick={login} style={{ ...BTN(true), width: '100%' }} disabled={loading}>{loading ? 'Accediendo...' : 'Entrar →'}</button>
      </div>
    </div>
  )

  const planBreakdown = ['free', 'pro', 'business', 'enterprise'].map(p => ({
    plan: p, count: users.filter(u => u.plan === p).length
  }))

  return (
    <div style={{ minHeight: '100vh', background: C.paper, fontFamily: "'Geist',sans-serif", color: C.navy }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Edit modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,41,66,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 40px rgba(15,41,66,0.2)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 20 }}>Editar usuario</h3>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: "'Geist Mono',monospace" }}>Email</label>
            <input style={{ ...INP, marginBottom: 14 }} type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            <label style={{ fontSize: 11, fontWeight: 600, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: "'Geist Mono',monospace" }}>Plan</label>
            <select style={{ ...INP, marginBottom: 24, cursor: 'pointer' }} value={editPlan} onChange={e => setEditPlan(e.target.value)}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditUser(null)} style={BTN(false)}>Cancelar</button>
              <button onClick={updateUser} style={{ ...BTN(true), flex: 1 }}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.steel1}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(15,41,66,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, color: C.paper }}>◈</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: C.navy }}>Admin — Media Planning Canvas</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/dashboard" style={{ fontSize: 13, color: C.steel, textDecoration: 'none' }}>← Volver al dashboard</a>
          <button onClick={loadUsers} style={BTN(false)} disabled={loading}>{loading ? '⏳' : '↺ Recargar'}</button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {msg && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: C.success, marginBottom: 20 }}>✓ {msg}</div>}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
          <div style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 2px rgba(15,41,66,0.04)' }}>
            <div style={{ fontSize: 11, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Geist Mono',monospace", marginBottom: 6 }}>Usuarios totales</div>
            <div style={{ fontSize: 32, fontWeight: 500, color: C.navy, fontFamily: "'Geist Mono',monospace" }}>{stats.totalUsers}</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 2px rgba(15,41,66,0.04)' }}>
            <div style={{ fontSize: 11, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Geist Mono',monospace", marginBottom: 6 }}>Planes creados</div>
            <div style={{ fontSize: 32, fontWeight: 500, color: C.navy, fontFamily: "'Geist Mono',monospace" }}>{stats.totalPlans}</div>
          </div>
          {planBreakdown.map(p => (
            <div key={p.plan} style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 2px rgba(15,41,66,0.04)' }}>
              <div style={{ fontSize: 11, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Geist Mono',monospace", marginBottom: 6 }}>{p.plan}</div>
              <div style={{ fontSize: 32, fontWeight: 500, fontFamily: "'Geist Mono',monospace", color: PLAN_COLORS[p.plan] || C.navy }}>{p.count}</div>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input style={{ ...INP, flex: 1, minWidth: 200 }} type="text" placeholder="Buscar por email o nombre..." value={search} onChange={e => setSearch(e.target.value)} />
          <select style={{ ...INP, width: 'auto', cursor: 'pointer', minWidth: 120 }} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
            <option value="all">Todos los planes</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <div style={{ fontSize: 13, color: C.steel, display: 'flex', alignItems: 'center', padding: '0 8px', background: C.paper2, borderRadius: 6, border: `1px solid ${C.steel1}` }}>
            {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Users table */}
        <div style={{ background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,41,66,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.paper, borderBottom: `1px solid ${C.steel1}` }}>
                {['Usuario', 'Plan', 'Planes creados', 'Registrado', 'Último acceso', 'Estado', 'Acciones'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.steel3, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Geist Mono',monospace", whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.steel3, fontSize: 14 }}>No hay usuarios que coincidan</td></tr>
              )}
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.steel1}` : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, color: C.navy }}>{u.full_name || '—'}</div>
                    <div style={{ fontSize: 12, color: C.steel3 }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, background: PLAN_COLORS[u.plan] + '18', color: PLAN_COLORS[u.plan] || C.steel, textTransform: 'uppercase', fontFamily: "'Geist Mono',monospace", letterSpacing: '0.05em' }}>
                      {u.plan}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: C.steel, fontFamily: "'Geist Mono',monospace" }}>{u.plan_count}</td>
                  <td style={{ padding: '12px 16px', color: C.steel3, fontSize: 12 }}>
                    {new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px', color: C.steel3, fontSize: 12 }}>
                    {u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: u.confirmed ? '#F0FDF4' : '#FFFBEB', color: u.confirmed ? C.success : C.warn, fontWeight: 600, fontFamily: "'Geist Mono',monospace" }}>
                      {u.confirmed ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditUser(u); setEditPlan(u.plan); setEditEmail(u.email) }}
                        style={{ padding: '5px 12px', borderRadius: 5, border: `1px solid ${C.steel1}`, background: 'transparent', color: C.steel, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist',sans-serif" }}>
                        Editar
                      </button>
                      <button onClick={() => deleteUser(u.id, u.email)}
                        style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B33A2E', fontSize: 12, cursor: 'pointer', fontFamily: "'Geist',sans-serif" }}>
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
