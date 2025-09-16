import { NextRequest, NextResponse } from 'next/server'
import { validateInitData } from '@/lib/telegram'
import { supabaseAdmin } from '@/lib/supabase'
import { publicClient } from '@/lib/viem'

// SHAH Price Oracle ABI (minimal)
const ORACLE_ABI = [
  {
    inputs: [],
    name: 'latestAnswer',
    outputs: [{ type: 'int256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export async function POST(request: NextRequest) {
  try {
    const { 
      initData, 
      merchantSlug, 
      amountUsd, 
      refCode,
      description = 'SHAH Payment'
    } = await request.json()

    // Validate Telegram initData
    const validation = await validateInitData(initData)
    if (!validation.ok) {
      return NextResponse.json({ error: 'Invalid initData' }, { status: 401 })
    }

    // Get merchant by slug
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('slug', merchantSlug)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Get SHAH price from oracle
    let shahPriceUsd = 0.01 // fallback price
    try {
      const oracleAddress = process.env.NEXT_PUBLIC_SHAH_PRICE_ORACLE
      if (oracleAddress) {
        const price = await publicClient.readContract({
          address: oracleAddress as `0x${string}`,
          abi: ORACLE_ABI,
          functionName: 'latestAnswer'
        })
        shahPriceUsd = Number(price) / 1e8 // assuming 8 decimals
      }
    } catch (error) {
      console.warn('Failed to fetch SHAH price from oracle:', error)
    }

    // Calculate SHAH amount (in wei)
    const amountShahWei = BigInt(Math.floor((amountUsd / shahPriceUsd) * 1e18))

    // Generate unique invoice ID
    const generateInvoiceId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = 'INV-'
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    let invoiceId = generateInvoiceId()
    let attempts = 0
    let invoiceCreated = false

    while (!invoiceCreated && attempts < 10) {
      const { error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert({
          merchant_id: merchant.id,
          invoice_id: invoiceId,
          amount_usd: amountUsd,
          amount_shah: amountShahWei.toString(),
          status: 'pending',
          provider: process.env.INVOICES_PROVIDER || 'telegram',
          ref_code: refCode?.toUpperCase()
        })

      if (invoiceError && invoiceError.code === '23505') { // Unique constraint violation
        invoiceId = generateInvoiceId()
        attempts++
      } else if (invoiceError) {
        console.error('Error creating invoice:', invoiceError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      } else {
        invoiceCreated = true
      }
    }

    if (!invoiceCreated) {
      return NextResponse.json({ error: 'Failed to generate unique invoice ID' }, { status: 500 })
    }

    // Prepare response based on provider
    const provider = process.env.INVOICES_PROVIDER || 'telegram'
    let paymentPayload = null

    if (provider === 'telegram') {
      // Telegram Pay payload
      paymentPayload = {
        title: description,
        description: `Invoice ${invoiceId}`,
        payload: `invoice_${invoiceId}`,
        provider_token: process.env.TELEGRAM_PAYMENT_TOKEN,
        currency: 'USD',
        prices: [{ label: 'Total', amount: Math.floor(amountUsd * 100) }], // in cents
        start_parameter: `invoice_${invoiceId}`,
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        is_flexible: false
      }
    } else if (provider === 'stripe') {
      // Stripe Checkout Session
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: description,
              description: `Invoice ${invoiceId}`
            },
            unit_amount: Math.floor(amountUsd * 100)
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_MINIAPP_URL}/merchant?success=true&invoice=${invoiceId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_MINIAPP_URL}/merchant?canceled=true&invoice=${invoiceId}`,
        metadata: {
          invoice_id: invoiceId,
          merchant_slug: merchantSlug
        }
      })
      paymentPayload = { sessionId: session.id, url: session.url }
    } else if (provider === 'onchain') {
      // On-chain SHAH payment
      paymentPayload = {
        type: 'onchain',
        to: merchant.wallet_address || '0x0000000000000000000000000000000000000000',
        amount: amountShahWei.toString(),
        currency: 'SHAH',
        gas: '21000'
      }
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoiceId,
        amountUsd,
        amountShah: amountShahWei.toString(),
        shahPriceUsd,
        status: 'pending',
        merchant: merchant.name,
        description,
        refCode: refCode?.toUpperCase()
      },
      payment: {
        provider,
        payload: paymentPayload
      }
    })

  } catch (error) {
    console.error('Error in invoices/create:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 