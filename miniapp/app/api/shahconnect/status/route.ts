import { NextRequest, NextResponse } from 'next/server'
import { validateInitData } from '@/lib/telegram'
import { getTelegramLink } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const initData = searchParams.get('initData')

    if (!initData) {
      return NextResponse.json(
        { error: 'initData is required' },
        { status: 400 }
      )
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      )
    }

    // Validate the initData
    const isValid = validateInitData(initData, botToken)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid initData' },
        { status: 401 }
      )
    }

    // Parse initData to get Telegram user info
    const urlParams = new URLSearchParams(initData)
    const userStr = urlParams.get('user')
    if (!userStr) {
      return NextResponse.json(
        { error: 'No user data in initData' },
        { status: 400 }
      )
    }

    const user = JSON.parse(userStr)
    const tgUserId = user.id

    // Check if Telegram is linked to a wallet
    const result = await getTelegramLink(tgUserId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to check link status' },
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json({
        linked: false,
        message: 'Telegram not linked to any wallet',
      })
    }

    return NextResponse.json({
      linked: true,
      walletAddress: result.data.users?.wallet_address,
      username: result.data.tg_username,
      linkedAt: result.data.linked_at,
      lastSeen: result.data.last_seen,
    })
  } catch (error) {
    console.error('Error checking ShahConnect status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 