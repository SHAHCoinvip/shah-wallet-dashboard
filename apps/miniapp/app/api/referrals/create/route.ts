import { NextRequest, NextResponse } from 'next/server'
import { validateInitData } from '@/lib/telegram'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { initData, inviterWallet } = await request.json()

    // Validate Telegram initData
    const validation = await validateInitData(initData)
    if (!validation.ok) {
      return NextResponse.json({ error: 'Invalid initData' }, { status: 401 })
    }

    // Generate unique referral code (8 chars: A-Z, 2-9)
    const generateRefCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'
      let result = ''
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    // Upsert user by wallet address
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        { wallet_address: inviterWallet.toLowerCase() },
        { onConflict: 'wallet_address' }
      )
      .select()
      .single()

    if (userError) {
      console.error('Error upserting user:', userError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Create referral record
    let refCode = generateRefCode()
    let attempts = 0
    let referralCreated = false

    while (!referralCreated && attempts < 10) {
      const { error: refError } = await supabaseAdmin
        .from('referrals')
        .insert({
          ref_code: refCode,
          inviter_user_id: user.id,
          active: true
        })

      if (refError && refError.code === '23505') { // Unique constraint violation
        refCode = generateRefCode()
        attempts++
      } else if (refError) {
        console.error('Error creating referral:', refError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      } else {
        referralCreated = true
      }
    }

    if (!referralCreated) {
      return NextResponse.json({ error: 'Failed to generate unique referral code' }, { status: 500 })
    }

    // Generate Telegram bot link
    const botUsername = process.env.TELEGRAM_BOT_USERNAME?.replace('@', '') || 'YourShahBot'
    const referralUrl = `https://t.me/${botUsername}?start=ref_${refCode}`

    return NextResponse.json({
      success: true,
      refCode,
      referralUrl,
      inviterWallet: inviterWallet.toLowerCase()
    })

  } catch (error) {
    console.error('Error in referrals/create:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 