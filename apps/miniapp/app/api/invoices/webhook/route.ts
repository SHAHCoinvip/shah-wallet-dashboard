import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-telegram-bot-api-signature') || 
                     request.headers.get('stripe-signature')

    // Handle Telegram Pay webhook
    if (signature && signature.includes('sha256=')) {
      return await handleTelegramWebhook(body, signature)
    }
    
    // Handle Stripe webhook
    if (signature && signature.startsWith('t=')) {
      return await handleStripeWebhook(body, signature)
    }

    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })

  } catch (error) {
    console.error('Error in invoices/webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleTelegramWebhook(body: string, signature: string) {
  try {
    // Verify Telegram webhook signature
    const crypto = require('crypto')
    const secret = process.env.TELEGRAM_BOT_WEBAPP_SECRET || ''
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    if (signature !== `sha256=${expectedSignature}`) {
      return NextResponse.json({ error: 'Invalid Telegram signature' }, { status: 401 })
    }

    const update = JSON.parse(body)
    
    // Handle pre-checkout query
    if (update.pre_checkout_query) {
      const { id, invoice_payload } = update.pre_checkout_query
      
      // Extract invoice ID from payload
      const invoiceId = invoice_payload.replace('invoice_', '')
      
      // Verify invoice exists and is pending
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('invoice_id', invoiceId)
        .eq('status', 'pending')
        .single()

      if (invoiceError || !invoice) {
        return NextResponse.json({ 
          ok: false, 
          error_message: 'Invoice not found or already paid' 
        })
      }

      return NextResponse.json({ ok: true })
    }

    // Handle successful payment
    if (update.message?.successful_payment) {
      const { invoice_payload, total_amount } = update.message.successful_payment
      const invoiceId = invoice_payload.replace('invoice_', '')
      
      // Update invoice status
      const { error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('invoice_id', invoiceId)
        .eq('status', 'pending')

      if (updateError) {
        console.error('Error updating invoice:', updateError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      // Record referral event if applicable
      const { data: invoice } = await supabaseAdmin
        .from('invoices')
        .select('ref_code')
        .eq('invoice_id', invoiceId)
        .single()

      if (invoice?.ref_code) {
        // This would typically be called from the bot, but we can record it here too
        await supabaseAdmin
          .from('referral_events')
          .insert({
            ref_code: invoice.ref_code,
            action: 'invoice_paid',
            metadata: { invoice_id: invoiceId, amount: total_amount }
          })
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Error handling Telegram webhook:', error)
    return NextResponse.json({ error: 'Telegram webhook error' }, { status: 500 })
  }
}

async function handleStripeWebhook(body: string, signature: string) {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Stripe webhook secret not configured' }, { status: 500 })
    }

    // Verify Stripe webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const invoiceId = session.metadata?.invoice_id

      if (!invoiceId) {
        return NextResponse.json({ error: 'No invoice ID in session metadata' }, { status: 400 })
      }

      // Update invoice status
      const { error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('invoice_id', invoiceId)
        .eq('status', 'pending')

      if (updateError) {
        console.error('Error updating invoice:', updateError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      // Record referral event if applicable
      const { data: invoice } = await supabaseAdmin
        .from('invoices')
        .select('ref_code')
        .eq('invoice_id', invoiceId)
        .single()

      if (invoice?.ref_code) {
        await supabaseAdmin
          .from('referral_events')
          .insert({
            ref_code: invoice.ref_code,
            action: 'invoice_paid',
            metadata: { 
              invoice_id: invoiceId, 
              amount: session.amount_total / 100, // Convert from cents
              provider: 'stripe'
            }
          })
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error handling Stripe webhook:', error)
    return NextResponse.json({ error: 'Stripe webhook error' }, { status: 400 })
  }
} 