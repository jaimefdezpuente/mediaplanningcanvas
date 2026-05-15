'use client'
import { useState, useRef, useEffect } from 'react'
import { MpcLockup } from '@/lib/MpcLogo'
import { getLimits } from '@/lib/plans'

const C = {
  paper:'#F6F4EF', paper2:'#ECE8DF',
  navy:'#0F2942', steel:'#4A6B8A',
  steel1:'#DDE2E8', steel2:'#B5C2D0', steel3:'#8AA0B5',
  accent:'#C75A3C', white:'#FFFFFF',
}

function pct(used: number, max: number | string) {
  const m = Number(max)
  if (!m || m >= 999) return used > 0 ? 100 : 0
  return Math.min(100, Math.round((used / m) * 100))
}

interface AppHeaderProps {
  userEmail?: string
  userName?: string
  userAvatar?: string
  planKey?: string
  usedPlans?: number
  usedAnalisis?: number
  usedMejoras?: number
  projectName?: string
  autoSaving?: boolean
  onSave?: () => void
  onLogout?: () => void
  children?: React.ReactNode  // para la navegación de pasos del wizard
}

export function AppHeader({
  userEmail = '',
  userName = '',
  userAvatar = '',
  planKey = 'free',
  usedPlans = 0,
  usedAnalisis = 0,
  usedMejoras = 0,
  projectName,
  autoSaving,
  onSave,
  onLogout,
  children,
}: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const limits = getLimits(planKey)
  const isPro = planKey !== 'free'
  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header style={{ background: C.white, borderBottom: `1px solid ${C.steel1}`, position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 2px rgba(15,41,66,0.05)' }}>
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Logo */}
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <MpcLockup size={22} />
        </a>

        {/* Nombre del proyecto (wizard) */}
        {projectName && (
          <>
            <div style={{ fontSize: 12, color: C.steel2 }}>|</div>
            <div style={{ fontSize: 13, color: C.navy, fontWeight: 500, whiteSpace: 'nowrap' }}>{projectName}</div>
          </>
        )}
        {autoSaving && (
          <span style={{ fontSize: 10, color: C.steel3, fontFamily: "'Geist Mono',monospace" }}>Guardando...</span>
        )}

        {/* Middle: nav de pasos (wizard) o nav links (dashboard) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {children ?? (
            <nav style={{ display: 'flex', gap: 4 }}>
              <a href="/dashboard" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, color: C.navy, background: C.paper, textDecoration: 'none' }}>Mis planes</a>
              <a href="/plan/nuevo" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, color: C.steel, textDecoration: 'none' }}>+ Nuevo plan</a>
            </nav>
          )}
        </div>

        {/* Créditos */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

          {/* Plan badge */}
          <div style={{ padding: '4px 10px', borderRadius: 4, background: isPro ? C.navy : C.paper2, color: isPro ? C.paper : C.steel, fontSize: 11, fontWeight: 600, fontFamily: "'Geist Mono',monospace", letterSpacing: '0.08em', textTransform: 'uppercase', border: isPro ? 'none' : `1px solid ${C.steel1}` }}>
            {planKey.toUpperCase()}
          </div>

          {/* Botón guardar (wizard) */}
          {onSave && (
            <button onClick={onSave} style={{ padding: '7px 14px', borderRadius: 6, background: C.navy, border: 'none', color: C.paper, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: "'Geist',sans-serif", flexShrink: 0 }}>
              Guardar
            </button>
          )}

          {/* Avatar + menú */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 34, height: 34, borderRadius: '50%', background: C.navy, color: C.paper, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden' }}>
              {userAvatar
                ? <img src={userAvatar} alt="avatar" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '50%' }} />
                : initials}
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 42, background: C.white, border: `1px solid ${C.steel1}`, borderRadius: 10, boxShadow: '0 8px 24px -8px rgba(15,41,66,0.15)', minWidth: 200, zIndex: 50, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.steel1}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{userName}</div>
                  <div style={{ fontSize: 11, color: C.steel3 }}>{userEmail}</div>
                </div>
                {[
                  { label: 'Editar perfil', href: '/perfil' },
                  { label: 'Cambiar contraseña', href: '/perfil?tab=password' },
                  { label: 'Facturas', href: '/perfil?tab=plan' },
                  { label: isPro ? 'Cambiar de plan' : '⭐ Actualizar a Pro', href: '/perfil?tab=plan' },
                ].map((item, i) => (
                  <a key={i} href={item.href} style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: i === 3 && !isPro ? C.accent : C.navy, textDecoration: 'none', borderBottom: i < 3 ? `1px solid ${C.steel1}` : 'none', fontWeight: i === 3 && !isPro ? 600 : 400 }}>
                    {item.label}
                  </a>
                ))}
                {onLogout && (
                  <button onClick={onLogout} style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 13, color: C.steel, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'Geist',sans-serif", borderTop: `1px solid ${C.steel1}` }}>
                    Cerrar sesión
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}