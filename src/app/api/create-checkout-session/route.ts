import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST(req: NextRequest) {
  try {
    const { email, priceId, walletAddress } = await req.json()

    if (!email || !priceId) {
      return NextResponse.json({ error: 'Missing email or priceId' }, { status: 400 })
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId, // 'price_monthly' or 'price_yearly'
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cancel`,
      metadata: {
        walletAddress: walletAddress || '',
        email: email,
      },
      subscription_data: {
        metadata: {
          walletAddress: walletAddress || '',
          email: email,
        },
      },
    })

    return NextResponse.json({ id: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
} 