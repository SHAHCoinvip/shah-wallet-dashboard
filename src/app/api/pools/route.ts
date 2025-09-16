import { NextRequest, NextResponse } from 'next/server'
import { balancerService } from '@/lib/balancer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const poolId = searchParams.get('poolId')

    if (poolId) {
      // Get specific pool
      const pool = await balancerService.getPoolById(poolId)
      if (!pool) {
        return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
      }
      return NextResponse.json({ pool })
    } else {
      // Get pools list
      const pools = await balancerService.getPools(limit, offset)
      return NextResponse.json({ pools })
    }
  } catch (error) {
    console.error('Pools API error:', error)
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
      case 'quote':
        const { tokenIn, tokenOut, amountIn, poolIds } = params
        const quote = await balancerService.getSwapQuote(tokenIn, tokenOut, amountIn, poolIds)
        return NextResponse.json({ quote })

      case 'poolsByTokens':
        const { tokenAddresses } = params
        const pools = await balancerService.getPoolsByTokens(tokenAddresses)
        return NextResponse.json({ pools })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Pools API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 