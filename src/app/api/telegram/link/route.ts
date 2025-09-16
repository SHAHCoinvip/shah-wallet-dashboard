import { NextRequest, NextResponse } from 'next/server'
import { supabase, generateLinkCode, cleanupExpiredLinks } from '@/lib/notifs'

export async function POST(req: NextRequest) {
  try {
    const { wallet } = await req.json()

    if (!wallet || typeof wallet !== 'string') {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 })
    }

    // Clean up expired links first
    await cleanupExpiredLinks()

    // Generate unique code
    let code = generateLinkCode()
    let attempts = 0
    
    while (attempts < 5) {
      // Check if code already exists
      const { data: existing } = await supabase
        .from('telegram_links')
        .select('code')
        .eq('code', code)
        .single()

      if (!existing) break
      
      code = generateLinkCode()
      attempts++
    }

    if (attempts >= 5) {
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 })
    }

    // Store the link code
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    
    const { error } = await supabase
      .from('telegram_links')
      .upsert({
        code,
        wallet_address: wallet.toLowerCase(),
        expires_at: expiresAt.toISOString()
      })

    if (error) {
      console.error('Failed to store telegram link:', error)
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
    }

    // Get bot username from environment or use default
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'shahcoinvipbot'
    
    // Create deep link
    const deepLink = `https://t.me/${botUsername}?start=${code}`
    const webappUrl = process.env.TELEGRAM_WEBAPP_URL || 'https://wallet.shah.vip'

    return NextResponse.json({
      success: true,
      code,
      deepLink,
      expiresAt: expiresAt.toISOString(),
      message: `Link expires in 1 hour. Use /start ${code} in Telegram to connect.`
    })

  } catch (error) {
    console.error('Telegram link creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code parameter required' }, { status: 400 })
    }

    // Look up the link
    const { data: link, error } = await supabase
      .from('telegram_links')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !link) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 })
    }

    // Check if expired
    if (new Date(link.expires_at) < new Date()) {
      // Clean up expired link
      await supabase
        .from('telegram_links')
        .delete()
        .eq('code', code)

      return NextResponse.json({ error: 'Code has expired' }, { status: 410 })
    }

    return NextResponse.json({
      success: true,
      wallet_address: link.wallet_address,
      created_at: link.created_at,
      expires_at: link.expires_at
    })

  } catch (error) {
    console.error('Telegram link lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}