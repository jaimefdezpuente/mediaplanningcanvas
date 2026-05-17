'use server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function planFromKey(key: string): string {
  if (key.includes('business'))  return 'business'
  if (key.includes('enterprise')) return 'enterprise'
  if (key.includes('pro'))        return 'pro'
  return 'pro'
}

async function findUser(email: string) {
  const { data } = await adminClient().auth.admin.listUsers()
  return data?.users?.find(u => u.email === email) ?? null
}

async function getEmailFromCustomer(customerId: string): Promise<string | null> {
  try {
    const c = await stripe.customers.retrieve(customerId) as Stripe.Customer
    return c.email ?? null
  } catch { return null }
}

/** Sólo actualiza el plan (sin tocar créditos) */
async function updateUserPlan(email: string, plan: string) {
  const user = await findUser(email)
  if (!user) return false
  await adminClient().auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, plan }
  })
  console.log(`✓ Plan updated: ${email} → ${plan}`)
  return true
}

/** Resetea créditos mensuales y guarda la fecha de inicio de período */
async function resetMonthlyCreditsByEmail(email: string, plan: string) {
  const user = await findUser(email)
  if (!user) return false
  await adminClient().auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      plan,
      used_analisis:   0,
      used_mejoras:    0,
      plan_period_start: new Date().toISOString(),
    }
  })
  console.log(`✓ Credits reset + plan_period_start saved: ${email} → ${plan}`)
  return true
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Nueva suscripción (checkout completado) ──────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email   = session.customer_email || session.metadata?.email
    const plan    = planFromKey(session.metadata?.plan || 'pro')
    if (email) await resetMonthlyCreditsByEmail(email, plan)
  }

  // ── Factura pagada (renovación mensual / anual) ───────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const inv = event.data.object as Stripe.Invoice
    if (inv.billing_reason === 'subscription_cycle') {
      const email = await getEmailFromCustomer(inv.customer as string)
      if (email) {
        const sub    = await stripe.subscriptions.retrieve(inv.subscription as string)
        const priceId = sub.items.data[0]?.price?.id || ''
        const allPrices: Record<string, string> = {
          [process.env.STRIPE_PRICE_PRO_MONTHLY||'']:        'pro',
          [process.env.STRIPE_PRICE_PRO_ANNUAL||'']:         'pro',
          [process.env.STRIPE_PRICE_BUSINESS_MONTHLY||'']:   'business',
          [process.env.STRIPE_PRICE_BUSINESS_ANNUAL||'']:    'business',
          [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY||'']: 'enterprise',
          [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL||'']:  'enterprise',
        }
        const plan = allPrices[priceId] || 'pro'
        await resetMonthlyCreditsByEmail(email, plan)
      }
    }
  }

  // ── Cambio de plan (actualización desde portal) ───────────────────────────
  if (event.type === 'customer.subscription.updated') {
    const sub   = event.data.object as Stripe.Subscription
    const email = await getEmailFromCustomer(sub.customer as string)
    if (email) {
      const priceId = sub.items.data[0]?.price?.id || ''
      const allPrices: Record<string, string> = {
        [process.env.STRIPE_PRICE_PRO_MONTHLY||'']:        'pro',
        [process.env.STRIPE_PRICE_PRO_ANNUAL||'']:         'pro',
        [process.env.STRIPE_PRICE_BUSINESS_MONTHLY||'']:   'business',
        [process.env.STRIPE_PRICE_BUSINESS_ANNUAL||'']:    'business',
        [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY||'']: 'enterprise',
        [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL||'']:  'enterprise',
      }
      const plan = allPrices[priceId] || 'pro'
      await updateUserPlan(email, plan)
    }
  }

  // ── Cancelación ───────────────────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub   = event.data.object as Stripe.Subscription
    const email = await getEmailFromCustomer(sub.customer as string)
    if (email) await updateUserPlan(email, 'free')
  }

  return NextResponse.json({ received: true })
}
