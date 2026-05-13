import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Media Planning Canvas Pro', description: 'Planes ilimitados · IA avanzada · 20+ horas de formación' },
          unit_amount: 1500,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `https://www.mediaplanningcanvas.com/dashboard?success=true`,
      cancel_url: `https://www.mediaplanningcanvas.com/registro?cancelled=true`,
      metadata: { email },
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: 'Error creating checkout' }, { status: 500 })
  }
}
