// src/app/api/create-checkout-session/route.ts

import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SHAH Token',
              description: 'Buy SHAH crypto tokens securely.',
            },
            unit_amount: 500, // $5.00 USD
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?canceled=true`,
    })

    return NextResponse.json({ id: session.id })
  } catch (err: any) {
    console.error('[Stripe Checkout Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
