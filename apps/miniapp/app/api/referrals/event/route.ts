import { NextRequest, NextResponse } from 'next/server'
import { validateInitData } from '@/lib/telegram'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { 
      initData, 
      refCode, 
      action, 
      inviteeWallet, 
      inviteeTgUserId, 
      metadata 
    } = await request.json()

    // Validate Telegram initData
    const validation = await validateInitData(initData)
    if (!validation.ok) {
      return NextResponse.json({ error: 'Invalid initData' }, { status: 401 })
    }

    // Validate action
    const validActions = ['joined', 'first_swap', 'first_stake', 'invoice_paid']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Check if referral code exists and is active
    const { data: referral, error: refError } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('ref_code', refCode.toUpperCase())
      .eq('active', true)
      .single()

    if (refError || !referral) {
      return NextResponse.json({ error: 'Invalid or inactive referral code' }, { status: 400 })
    }

    // Check for duplicate events (prevent spam)
    const { data: existingEvent } = await supabaseAdmin
      .from('referral_events')
      .select('id')
      .eq('ref_code', refCode.toUpperCase())
      .eq('invitee_tg_user_id', inviteeTgUserId)
      .eq('action', action)
      .single()

    if (existingEvent) {
      return NextResponse.json({ 
        success: true, 
        message: 'Event already recorded',
        duplicate: true 
      })
    }

    // Create referral event
    const { error: eventError } = await supabaseAdmin
      .from('referral_events')
      .insert({
        ref_code: refCode.toUpperCase(),
        invitee_tg_user_id: inviteeTgUserId,
        invitee_wallet_address: inviteeWallet?.toLowerCase(),
        action,
        metadata: metadata || {}
      })

    if (eventError) {
      console.error('Error creating referral event:', eventError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Get updated stats for the referral
    const { data: events, error: statsError } = await supabaseAdmin
      .from('referral_events')
      .select('action')
      .eq('ref_code', refCode.toUpperCase())

    if (statsError) {
      console.error('Error fetching referral stats:', statsError)
    }

    const stats = {
      total_invites: events?.length || 0,
      joined: events?.filter(e => e.action === 'joined').length || 0,
      first_swap: events?.filter(e => e.action === 'first_swap').length || 0,
      first_stake: events?.filter(e => e.action === 'first_stake').length || 0,
      invoice_paid: events?.filter(e => e.action === 'invoice_paid').length || 0
    }

    return NextResponse.json({
      success: true,
      event: {
        refCode: refCode.toUpperCase(),
        action,
        inviteeTgUserId,
        inviteeWallet: inviteeWallet?.toLowerCase()
      },
      stats
    })

  } catch (error) {
    console.error('Error in referrals/event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 