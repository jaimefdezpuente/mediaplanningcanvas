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
  if (key.includes('business')) return 'business'
  if (key.includes('enterprise')) return 'enterprise'
  if (key.includes('pro')) return 'pro'
  return 'pro'
}

async function updateUserPlan(email: string, plan: string) {
  const supabase = adminClient()
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find(u => u.email === email)
  if (user) {
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, plan }
    })
    console.log(`✓ Plan updated: ${email} → ${plan}`)
    return true
  }
  return false
}

async function getEmailFromCustomer(customerId: string): Promise<string|null> {
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
    return customer.email || null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Checkout completed (new subscription or upgrade) ─────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_email || session.metadata?.email
    const planKey = planFromKey(session.metadata?.plan || 'pro')
    if (email) await updateUserPlan(email, planKey)
  }

  // ── Subscription updated (upgrade/downgrade via portal) ───────────────────
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const email = await getEmailFromCustomer(sub.customer as string)
    if (email) {
      // Get plan from the price ID
      const priceId = sub.items.data[0]?.price?.id || ''
      const allPrices = {
        [process.env.STRIPE_PRICE_PRO_MONTHLY||'']: 'pro',
        [process.env.STRIPE_PRICE_PRO_ANNUAL||'']: 'pro',
        [process.env.STRIPE_PRICE_BUSINESS_MONTHLY||'']: 'business',
        [process.env.STRIPE_PRICE_BUSINESS_ANNUAL||'']: 'business',
        [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY||'']: 'enterprise',
        [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL||'']: 'enterprise',
      }
      const plan = allPrices[priceId] || 'pro'
      await updateUserPlan(email, plan)
    }
  }

  // ── Subscription cancelled ────────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const email = await getEmailFromCustomer(sub.customer as string)
    if (email) await updateUserPlan(email, 'free')
  }

  return NextResponse.json({ received: true })
}
