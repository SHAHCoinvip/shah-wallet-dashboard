import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { updateOrderStatus, getOrderBySessionId, upsertUser } from '@/lib/supabase'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Webhook handles payment events and updates our database

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed.', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`✅ Payment received: ${session.customer_details?.email} paid $${(session.amount_total || 0) / 100}`)
        
        // Handle token creation payment
        if (session.mode === 'payment' && session.client_reference_id) {
          await handleTokenCreationPayment(session)
        }
        
        // Handle subscription creation
        if (session.mode === 'subscription' && session.subscription) {
          await handleSubscriptionCreated(session.subscription as string)
        }
        break

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription.id)
        break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(updatedSubscription)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(deletedSubscription)
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          await handleSubscriptionPaymentSucceeded(invoice.subscription as string)
        }
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        if (failedInvoice.subscription) {
          await handleSubscriptionPaymentFailed(failedInvoice.subscription as string)
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleTokenCreationPayment(session: Stripe.Checkout.Session) {
  try {
    // Update order status to paid
    await updateOrderStatus(
      session.id, 
      'paid', 
      session.payment_intent as string
    )
    
    console.log(`✅ Token creation payment completed for session ${session.id}`)
    
    // Update user record if needed
    if (session.client_reference_id) {
      await upsertUser({
        wallet: session.client_reference_id,
        email: session.customer_details?.email || undefined,
        is_premium: false, // Token creation doesn't make them premium
      })
    }
  } catch (error) {
    console.error('Error handling token creation payment:', error)
  }
}

async function handleSubscriptionCreated(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    
    // Store subscription data in Supabase
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        subscription_id: subscriptionId,
        customer_id: subscription.customer as string,
        wallet_address: subscription.metadata.walletAddress || '',
        email: subscription.metadata.email || customer.email || '',
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000),
        price_id: subscription.items.data[0]?.price.id,
        created_at: new Date(),
      })

    if (error) {
      console.error('Error storing subscription:', error)
    } else {
      console.log(`✅ Subscription created for ${subscription.metadata.email}`)
    }
  } catch (error) {
    console.error('Error handling subscription creation:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000),
        updated_at: new Date(),
      })
      .eq('subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log(`✅ Subscription updated: ${subscription.id}`)
    }
  } catch (error) {
    console.error('Error handling subscription update:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date(),
        updated_at: new Date(),
      })
      .eq('subscription_id', subscription.id)

    if (error) {
      console.error('Error canceling subscription:', error)
    } else {
      console.log(`✅ Subscription canceled: ${subscription.id}`)
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

async function handleSubscriptionPaymentSucceeded(subscriptionId: string) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date(),
      })
      .eq('subscription_id', subscriptionId)

    if (error) {
      console.error('Error updating payment status:', error)
    } else {
      console.log(`✅ Payment succeeded for subscription: ${subscriptionId}`)
    }
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handleSubscriptionPaymentFailed(subscriptionId: string) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date(),
      })
      .eq('subscription_id', subscriptionId)

    if (error) {
      console.error('Error updating payment failure status:', error)
    } else {
      console.log(`⚠️ Payment failed for subscription: ${subscriptionId}`)
    }
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}
