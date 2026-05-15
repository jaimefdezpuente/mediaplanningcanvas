'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function WizardInner() {
  const [status, setStatus] = useState('Verificando sesion...')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function check() {
      try {
        const res = await supabase.auth.getUser()
        const user = res.data.user
        if (!user) {
          setStatus('Sin sesion - redirigiendo...')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
        setStatus('OK: ' + user.email)
      } catch(e) {
        setStatus('Error: ' + String(e))
      }
    }
    check()
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#F6F4EF', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, fontFamily:'sans-serif' }}>
      <div style={{ fontSize:18, color:'#0F2942' }}>{status}</div>
      <a href="/dashboard" style={{ color:'#4A6B8A' }}>Volver al dashboard</a>
    </div>
  )
}

export default function NuevoPlanPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <WizardInner />
    </Suspense>
  )
}
