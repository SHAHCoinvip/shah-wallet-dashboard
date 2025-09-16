import { NextRequest, NextResponse } from 'next/server'
import { upsertUserSubscription } from '@/lib/notifs'

export async function POST(req: NextRequest) {
  try {
    const { wallet_address, telegram_user_id } = await req.json()

    if (!wallet_address || !telegram_user_id) {
      return NextResponse.json({ 
        error: 'Wallet address and Telegram user ID required' 
      }, { status: 400 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return NextResponse.json({ 
        error: 'Invalid wallet address format' 
      }, { status: 400 })
    }

    // Validate Telegram user ID (should be numeric string)
    if (!/^\d+$/.test(telegram_user_id)) {
      return NextResponse.json({ 
        error: 'Invalid Telegram user ID format' 
      }, { status: 400 })
    }

    // Update or create user subscription with Telegram ID
    const success = await upsertUserSubscription({
      wallet_address: wallet_address.toLowerCase(),
      telegram_user_id,
      wants_price: true,
      wants_new_tokens: true,
      wants_verifications: true,
      price_threshold_pct: 5
    })

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to link Telegram account' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram account linked successfully'
    })

  } catch (error) {
    console.error('Telegram wallet linking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}