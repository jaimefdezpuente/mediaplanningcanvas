// app/pago-completado/page.tsx
'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const PLAN_VALUES: Record<string, number> = {
  pro_monthly: 15,
  pro_annual: 144,
  business_monthly: 39,
  business_annual: 374,
  enterprise_monthly: 99,
  enterprise_annual: 950,
}

export default function PagoCompletado() {
  const params = useSearchParams()

  useEffect(() => {
    const plan = params.get('plan') || 'pro_monthly'
    const value = PLAN_VALUES[plan] || 15
    const w = window as Window & { gtag?: Function }

    if (w.gtag) {
      // Evento purchase — GA4 lo envía a Google Ads automáticamente
      w.gtag('event', 'purchase', {
        transaction_id: `mpc_${plan}_${Date.now()}`,
        value: value,
        currency: 'EUR',
        items: [{
          item_id: plan,
          item_name: `Media Planning Canvas ${plan}`,
          price: value,
          quantity: 1,
        }]
      })
    }
  }, [params])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Geist',sans-serif", background:'#F6F4EF' }}>
      <div style={{ textAlign:'center', padding:40 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
        <h1 style={{ fontSize:28, fontWeight:600, color:'#0F2942', marginBottom:8 }}>¡Pago completado!</h1>
        <p style={{ fontSize:16, color:'#4A6B8A', marginBottom:32 }}>Tu plan ya está activo. Empecemos a crear tu plan de marketing.</p>
        <a href="/dashboard" style={{ background:'#0F2942', color:'#fff', padding:'12px 28px', borderRadius:8, textDecoration:'none', fontWeight:600, fontSize:15 }}>
          Ir al dashboard →
        </a>
      </div>
    </div>
  )
}
