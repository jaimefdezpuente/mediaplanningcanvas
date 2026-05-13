'use server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (!customers.data.length) {
      return NextResponse.json({ error: 'No se encontró una suscripción activa para este email.' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: 'https://www.mediaplanningcanvas.com/perfil?tab=plan',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json({ error: 'Error al abrir el portal de facturación.' }, { status: 500 })
  }
}
