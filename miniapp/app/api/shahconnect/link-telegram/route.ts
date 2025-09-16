import { NextRequest, NextResponse } from 'next/server'
import { validateInitData } from '@/lib/telegram'
import { linkTelegramToWallet } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { initData, walletAddress } = await request.json()

    if (!initData || !walletAddress) {
      return NextResponse.json(
        { error: 'initData and walletAddress are required' },
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
    const tgUsername = user.username || null

    // Link Telegram to wallet
    const result = await linkTelegramToWallet(tgUserId, tgUsername, walletAddress)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to link Telegram to wallet' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram linked successfully',
      link: result.link,
    })
  } catch (error) {
    console.error('Error linking Telegram:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 