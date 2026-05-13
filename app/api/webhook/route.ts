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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_email || session.metadata?.email
    const plan = session.metadata?.plan || 'pro'

    if (email) {
      const supabase = adminClient()
      // Find user by email and update their plan
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === email)
      if (user) {
        const planKey = plan.includes('business') ? 'business' : plan.includes('enterprise') ? 'enterprise' : 'pro'
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, plan: planKey }
        })
        console.log(`✓ Plan updated: ${email} → ${planKey}`)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
    const email = customer.email

    if (email) {
      const supabase = adminClient()
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === email)
      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, plan: 'free' }
        })
        console.log(`✓ Plan downgraded to free: ${email}`)
      }
    }
  }

  return NextResponse.json({ received: true })
}
