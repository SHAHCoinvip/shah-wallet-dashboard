import { NextRequest, NextResponse } from 'next/server'
import { gasOptimizationService } from '@/lib/gasOptimization'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainId = parseInt(searchParams.get('chainId') || '1')

    const gasPrices = await gasOptimizationService.getGasPrices(chainId)
    
    if (!gasPrices) {
      return NextResponse.json({ error: 'Gas prices not available' }, { status: 404 })
    }

    return NextResponse.json({ gasPrices })
  } catch (error) {
    console.error('Gas API error:', error)
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
      case 'allGasPrices': {
        const allGasPrices = await gasOptimizationService.getAllGasPrices()
        return NextResponse.json({ gasPrices: allGasPrices })
      }

      case 'findCheapest': {
        const { estimatedGas, priority } = params
        const cheapest = await gasOptimizationService.findCheapestNetwork(estimatedGas, priority)
        return NextResponse.json({ cheapest })
      }

      case 'optimizeTransaction': {
        const { chainId, estimatedGas, priority } = params
        const optimized = await gasOptimizationService.optimizeTransaction(chainId, estimatedGas, priority)
        return NextResponse.json({ optimized })
      }

      case 'batchTransactions': {
        const { transactions } = params
        const batch = await gasOptimizationService.batchTransactions(transactions)
        return NextResponse.json({ batch })
      }

      case 'estimateCost': {
        const { chainId: chain, estimatedGas: gas, priority: pri } = params
        const cost = await gasOptimizationService.estimateTransactionCost(chain, gas, pri)
        return NextResponse.json({ cost })
      }

      case 'recommendedSettings': {
        const { chainId: cid, estimatedGas: eg, urgency } = params
        const settings = await gasOptimizationService.getRecommendedGasSettings(cid, eg, urgency)
        return NextResponse.json({ settings })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Gas API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 