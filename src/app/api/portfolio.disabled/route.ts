import { NextRequest, NextResponse } from 'next/server'
import { portfolioService } from '@/lib/portfolio'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const networks = searchParams.get('networks')?.split(',') || ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism']

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    const summary = await portfolioService.getPortfolioSummary(address, networks)
    
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Portfolio API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'performance':
        const { address, timeframe } = params
        const performance = await portfolioService.getPortfolioPerformance(address, timeframe)
        return NextResponse.json({ performance })

      case 'assetPnL':
        const { address: addr, tokenAddress, entryPrice, entryAmount } = params
        const pnl = await portfolioService.getAssetPnL(addr, tokenAddress, entryPrice, entryAmount)
        return NextResponse.json({ pnl })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Portfolio API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 