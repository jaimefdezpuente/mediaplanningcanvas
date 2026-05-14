'use client'
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data, error } = await supabase.from('plans').select('id').eq('id', params.id).eq('user_id', user.id).single()
      if (error || !data) { router.push('/dashboard'); return }
      router.push(`/plan/nuevo?plan_id=${params.id}`)
    }
    load()
  }, [params.id])

  return (
    <div style={{ minHeight:'100vh', background:'#F6F4EF', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Geist',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:'2px solid #0F2942', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
        <div style={{ fontSize:14, color:'#4A6B8A' }}>Cargando tu plan...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
