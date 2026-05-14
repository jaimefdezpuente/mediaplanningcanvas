'use server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const prices: Record<string, string> = {
      [process.env.STRIPE_PRICE_PRO_MONTHLY||'x']: 'pro',
      [process.env.STRIPE_PRICE_PRO_ANNUAL||'x']: 'pro',
      [process.env.STRIPE_PRICE_BUSINESS_MONTHLY||'x']: 'business',
      [process.env.STRIPE_PRICE_BUSINESS_ANNUAL||'x']: 'business',
      [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY||'x']: 'enterprise',
      [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL||'x']: 'enterprise',
    }

    // Find active subscription for this email
    const customers = await stripe.customers.list({ email, limit: 1 })
    let plan = 'free'
    if (customers.data.length > 0) {
      const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: 'active', limit: 1 })
      if (subs.data.length > 0) {
        const priceId = subs.data[0].items.data[0]?.price?.id || ''
        plan = prices[priceId] || 'pro'
      }
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: users } = await admin.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === email)
    if (user) {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, plan }
      })
      return NextResponse.json({ plan })
    }
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
