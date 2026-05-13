'use server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const PRICES: Record<string, string> = {
  pro_monthly:        process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  pro_annual:         process.env.STRIPE_PRICE_PRO_ANNUAL || '',
  business_monthly:   process.env.STRIPE_PRICE_BUSINESS_MONTHLY || '',
  business_annual:    process.env.STRIPE_PRICE_BUSINESS_ANNUAL || '',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
  enterprise_annual:  process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || '',
}

export async function POST(req: NextRequest) {
  try {
    const { email, plan = 'pro_monthly' } = await req.json()
    const priceId = PRICES[plan] || PRICES.pro_monthly
    if (!priceId) return NextResponse.json({ error: 'Plan no válido' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://www.mediaplanningcanvas.com/dashboard?success=true&plan=${plan}`,
      cancel_url: `https://www.mediaplanningcanvas.com/registro?cancelled=true`,
      metadata: { email, plan },
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: 'Error creating checkout' }, { status: 500 })
  }
}
