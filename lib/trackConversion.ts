// lib/trackConversion.ts
// Llama a esta función justo después de que Stripe confirme el pago

export function trackGoogleAdsConversion(plan: string, value: number) {
  if (typeof window === 'undefined') return
  const w = window as Window & { gtag?: Function }
  if (!w.gtag) return

  // ID de conversión — lo obtienes en Google Ads (ver instrucciones abajo)
  const CONVERSION_ID = process.env.NEXT_PUBLIC_GADS_CONVERSION_ID || ''
  const CONVERSION_LABEL = process.env.NEXT_PUBLIC_GADS_CONVERSION_LABEL || ''

  w.gtag('event', 'conversion', {
    send_to: `${CONVERSION_ID}/${CONVERSION_LABEL}`,
    value: value,
    currency: 'EUR',
    transaction_id: `mpc_${plan}_${Date.now()}`,
  })
}
