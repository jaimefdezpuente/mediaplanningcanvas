// app/pago-completado/page.tsx
import { Suspense } from 'react'
import PagoCompletadoInner from './PagoCompletadoInner'

export default function PagoCompletado() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F6F4EF' }}>
        <p style={{ color:'#4A6B8A', fontFamily:"'Geist',sans-serif" }}>Procesando...</p>
      </div>
    }>
      <PagoCompletadoInner />
    </Suspense>
  )
}
