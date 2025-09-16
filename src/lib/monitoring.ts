// Error monitoring and rate limiting utilities

export interface ErrorLog {
  timestamp: number
  error: string
  stack?: string
  userAgent?: string
  userId?: string
  endpoint?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests: boolean
  skipFailedRequests: boolean
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Log error for monitoring
 */
export function logError(error: Error | string, metadata?: {
  userId?: string
  endpoint?: string
  severity?: ErrorLog['severity']
}): void {
  const errorLog: ErrorLog = {
    timestamp: Date.now(),
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    userId: metadata?.userId,
    endpoint: metadata?.endpoint,
    severity: metadata?.severity || 'medium'
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorLog)
  }

  // In production, send to monitoring service (e.g., Sentry, LogRocket)
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to external monitoring service
    // sendToMonitoringService(errorLog)
  }

  // Store locally for admin dashboard
  storeErrorLog(errorLog)
}

/**
 * Store error log locally
 */
function storeErrorLog(errorLog: ErrorLog): void {
  try {
    const stored = localStorage.getItem('shah-error-logs')
    const logs: ErrorLog[] = stored ? JSON.parse(stored) : []
    
    // Keep only last 100 errors
    logs.push(errorLog)
    if (logs.length > 100) {
      logs.shift()
    }
    
    localStorage.setItem('shah-error-logs', JSON.stringify(logs))
  } catch (error) {
    console.error('Failed to store error log:', error)
  }
}

/**
 * Get stored error logs
 */
export function getErrorLogs(): ErrorLog[] {
  try {
    const stored = localStorage.getItem('shah-error-logs')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to retrieve error logs:', error)
    return []
  }
}

/**
 * Rate limiting middleware
 */
export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `rate_limit_${identifier}`
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key)
  
  // Reset if window has expired
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs
    }
  }
  
  // Check if request is allowed
  const allowed = entry.count < config.maxRequests
  
  if (allowed) {
    entry.count++
    rateLimitStore.set(key, entry)
  }
  
  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime
  }
}

/**
 * API route rate limiting
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request): Response | null => {
    // Get identifier (IP address or user ID)
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
    
    const result = checkRateLimit(ip, config)
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    return null // Continue processing
  }
}

/**
 * Security monitoring utilities
 */
export class SecurityMonitor {
  private static suspiciousActivities: Array<{
    timestamp: number
    type: string
    identifier: string
    details: any
  }> = []

  static logSuspiciousActivity(
    type: 'failed_login' | 'rate_limit_exceeded' | 'invalid_signature' | 'unusual_pattern',
    identifier: string,
    details?: any
  ): void {
    const activity = {
      timestamp: Date.now(),
      type,
      identifier,
      details
    }

    this.suspiciousActivities.push(activity)
    
    // Keep only last 1000 activities
    if (this.suspiciousActivities.length > 1000) {
      this.suspiciousActivities.shift()
    }

    // Log critical activities immediately
    if (type === 'invalid_signature' || this.getActivityCount(identifier, type, 300000) > 5) {
      logError(`Suspicious activity detected: ${type}`, {
        userId: identifier,
        severity: 'high'
      })
    }
  }

  static getActivityCount(identifier: string, type: string, timeWindowMs: number): number {
    const cutoff = Date.now() - timeWindowMs
    return this.suspiciousActivities.filter(
      activity => 
        activity.identifier === identifier &&
        activity.type === type &&
        activity.timestamp > cutoff
    ).length
  }

  static getSuspiciousActivities(limit = 50): typeof SecurityMonitor.suspiciousActivities {
    return this.suspiciousActivities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
}

/**
 * Contract interaction monitoring
 */
export function monitorContractInteraction(
  contractAddress: string,
  functionName: string,
  userAddress?: string,
  txHash?: string
): void {
  const interaction = {
    timestamp: Date.now(),
    contractAddress,
    functionName,
    userAddress,
    txHash
  }

  // Store interaction log
  try {
    const stored = localStorage.getItem('shah-contract-interactions')
    const interactions = stored ? JSON.parse(stored) : []
    
    interactions.push(interaction)
    
    // Keep only last 500 interactions
    if (interactions.length > 500) {
      interactions.shift()
    }
    
    localStorage.setItem('shah-contract-interactions', JSON.stringify(interactions))
  } catch (error) {
    console.error('Failed to store contract interaction:', error)
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static metrics: Array<{
    name: string
    duration: number
    timestamp: number
  }> = []

  static startTimer(name: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
    }
  }

  static recordMetric(name: string, duration: number): void {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now()
    })

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift()
    }

    // Log slow operations
    if (duration > 5000) { // 5 seconds
      logError(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, {
        severity: 'medium'
      })
    }
  }

  static getMetrics(): typeof PerformanceMonitor.metrics {
    return this.metrics
  }

  static getAverageTime(name: string, timeWindowMs = 3600000): number {
    const cutoff = Date.now() - timeWindowMs
    const relevantMetrics = this.metrics.filter(
      m => m.name === name && m.timestamp > cutoff
    )

    if (relevantMetrics.length === 0) return 0

    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / relevantMetrics.length
  }
}

/**
 * Health check utilities
 */
export async function performHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: Array<{
    name: string
    status: 'pass' | 'fail'
    message?: string
    responseTime?: number
  }>
}> {
  const checks = []
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  // Check RPC connectivity
  try {
    const start = performance.now()
    // This would be a real RPC call in production
    const responseTime = performance.now() - start
    
    checks.push({
      name: 'RPC Connection',
      status: 'pass' as const,
      responseTime
    })
  } catch (error) {
    checks.push({
      name: 'RPC Connection',
      status: 'fail' as const,
      message: 'Failed to connect to RPC endpoint'
    })
    overallStatus = 'unhealthy'
  }

  // Check error rate
  const recentErrors = getErrorLogs().filter(
    log => log.timestamp > Date.now() - 300000 // Last 5 minutes
  )

  if (recentErrors.length > 10) {
    checks.push({
      name: 'Error Rate',
      status: 'fail' as const,
      message: `High error rate: ${recentErrors.length} errors in 5 minutes`
    })
    overallStatus = 'degraded'
  } else {
    checks.push({
      name: 'Error Rate',
      status: 'pass' as const,
      message: `${recentErrors.length} errors in 5 minutes`
    })
  }

  // Check performance
  const avgResponseTime = PerformanceMonitor.getAverageTime('api_request')
  if (avgResponseTime > 2000) {
    checks.push({
      name: 'Performance',
      status: 'fail' as const,
      message: `High average response time: ${avgResponseTime.toFixed(2)}ms`
    })
    if (overallStatus === 'healthy') overallStatus = 'degraded'
  } else {
    checks.push({
      name: 'Performance',
      status: 'pass' as const,
      message: `Average response time: ${avgResponseTime.toFixed(2)}ms`
    })
  }

  return { status: overallStatus, checks }
}