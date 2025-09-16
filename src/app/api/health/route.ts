import { NextResponse } from 'next/server'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      checks: {
        database: 'unknown',
        contracts: 'unknown',
        telegram: 'unknown',
        stripe: 'unknown'
      }
    }

    // Check database connection (if Supabase is configured)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        // Simple ping to Supabase
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
          }
        })
        healthStatus.checks.database = response.ok ? 'healthy' : 'unhealthy'
      } catch (error) {
        healthStatus.checks.database = 'error'
      }
    }

    // Check contract addresses are configured
    const requiredContracts = [
      'NEXT_PUBLIC_SHAH',
      'NEXT_PUBLIC_SHAHSWAP_ROUTER',
      'NEXT_PUBLIC_STAKING',
      'NEXT_PUBLIC_FACTORY',
      'NEXT_PUBLIC_REGISTRY'
    ]
    
    const missingContracts = requiredContracts.filter(contract => !process.env[contract])
    healthStatus.checks.contracts = missingContracts.length === 0 ? 'healthy' : 'missing'

    // Check Telegram bot configuration
    if (process.env.TELEGRAM_BOT_TOKEN) {
      healthStatus.checks.telegram = 'configured'
    } else {
      healthStatus.checks.telegram = 'not_configured'
    }

    // Check Stripe configuration
    if (process.env.STRIPE_SECRET_KEY) {
      healthStatus.checks.stripe = 'configured'
    } else {
      healthStatus.checks.stripe = 'not_configured'
    }

    // Calculate response time
    const responseTime = Date.now() - startTime
    healthStatus.responseTime = `${responseTime}ms`

    // Determine overall status
    const allChecks = Object.values(healthStatus.checks)
    const hasErrors = allChecks.some(check => check === 'error' || check === 'unhealthy')
    const hasMissing = allChecks.some(check => check === 'missing')

    if (hasErrors) {
      healthStatus.status = 'unhealthy'
    } else if (hasMissing) {
      healthStatus.status = 'degraded'
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthStatus, { status: statusCode })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 })
  }
} 