import { NextRequest, NextResponse } from 'next/server'
import { validateInitData, parseInitData } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json()

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

    // Parse the initData to extract user information
    const parsedData = parseInitData(initData)
    if (!parsedData) {
      return NextResponse.json(
        { error: 'Failed to parse initData' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      tgUserId: parsedData.user?.id,
      username: parsedData.user?.username,
      startParam: parsedData.start_param,
    })
  } catch (error) {
    console.error('Error verifying initData:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 