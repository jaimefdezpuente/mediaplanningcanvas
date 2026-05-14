'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { MpcLockup } from '@/lib/MpcLogo'

const C = { paper:'#F6F4EF', navy:'#0F2942', steel:'#4A6B8A', steel1:'#DDE2E8', steel3:'#8AA0B5', accent:'#C75A3C', white:'#FFFFFF', success:'#2F7D5C' }

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data, error } = await supabase.from('plans').select('*').eq('id', params.id).eq('user_id', user.id).single()
      if (error || !data) { setNotFound(true); setLoading(false); return }
      // Redirect to wizard with this plan loaded (for now redirect to nuevo)
      // In a future session we'll load the plan data into the wizard
      router.push(`/plan/nuevo?plan_id=${params.id}`)
    }
    load()
  }, [params.id])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.paper, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Geist',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:`2px solid ${C.navy}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
        <div style={{ fontSize:14, color:C.steel }}>Cargando plan...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight:'100vh', background:C.paper, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Geist',sans-serif", padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <MpcLockup size={28} style={{ justifyContent:'center', marginBottom:32 }} />
        <h1 style={{ fontSize:22, fontWeight:600, color:C.navy, marginBottom:8 }}>Plan no encontrado</h1>
        <p style={{ fontSize:14, color:C.steel, marginBottom:24 }}>Este plan no existe o no tienes acceso a él.</p>
        <button onClick={()=>router.push('/dashboard')} style={{ padding:'10px 24px', borderRadius:6, background:C.navy, border:'none', color:C.paper, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:"'Geist',sans-serif" }}>
          Volver al dashboard
        </button>
      </div>
    </div>
  )

  return null
}
