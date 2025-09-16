import { getBestQuote, getShahSwapQuote, getBalancerQuoteWrapper, QuoteParams } from '../quotes'
import { getBalancerQuote } from '../balancer/quote'

// Mock the Balancer quote function
jest.mock('../balancer/quote', () => ({
  getBalancerQuote: jest.fn()
}))

const mockGetBalancerQuote = getBalancerQuote as jest.MockedFunction<typeof getBalancerQuote>

describe('Quotes', () => {
  const mockParams: QuoteParams = {
    tokenInAddress: '0x123',
    tokenOutAddress: '0x456',
    amountIn: '1000000000000000000', // 1 ETH in wei
    slippageBps: 50 // 0.5%
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getShahSwapQuote', () => {
    it('should return a valid ShahSwap quote', async () => {
      const quote = await getShahSwapQuote(mockParams)

      expect(quote).toBeDefined()
      expect(quote?.routeLabel).toBe('ShahSwap')
      expect(quote?.hops).toBe(1)
      expect(quote?.amountOut).toBeDefined()
      expect(quote?.priceImpactBps).toBeGreaterThan(0)
    })

    it('should handle errors gracefully', async () => {
      // Mock a scenario where ShahSwap quote fails
      const quote = await getShahSwapQuote({
        ...mockParams,
        tokenInAddress: 'invalid'
      })

      expect(quote).toBeNull()
    })
  })

  describe('getBalancerQuoteWrapper', () => {
    it('should return Balancer quote when enabled', async () => {
      const mockBalancerQuote = {
        amountOut: '999000000000000000',
        priceImpactBps: 25,
        routeLabel: 'Balancer Weighted',
        hops: 1,
        pool: {
          id: 'pool1',
          address: '0x789',
          poolType: 'Weighted' as const,
          tokens: [],
          totalLiquidity: '1000000',
          swapFee: 0.003,
          lastUpdate: 1234567890
        },
        effectiveSlippageBps: 50
      }

      mockGetBalancerQuote.mockResolvedValue(mockBalancerQuote)

      const quote = await getBalancerQuoteWrapper(mockParams)

      expect(quote).toEqual(mockBalancerQuote)
      expect(mockGetBalancerQuote).toHaveBeenCalledWith(mockParams)
    })

    it('should return null when Balancer routing is disabled', async () => {
      // Temporarily disable Balancer routing
      const originalEnv = process.env.NEXT_PUBLIC_ENABLE_BALANCER_POOLS
      process.env.NEXT_PUBLIC_ENABLE_BALANCER_POOLS = 'false'

      const quote = await getBalancerQuoteWrapper(mockParams)

      expect(quote).toBeNull()
      expect(mockGetBalancerQuote).not.toHaveBeenCalled()

      // Restore environment
      process.env.NEXT_PUBLIC_ENABLE_BALANCER_POOLS = originalEnv
    })

    it('should handle Balancer quote errors gracefully', async () => {
      mockGetBalancerQuote.mockRejectedValue(new Error('Balancer error'))

      const quote = await getBalancerQuoteWrapper(mockParams)

      expect(quote).toBeNull()
    })
  })

  describe('getBestQuote', () => {
    it('should return ShahSwap when it has better output', async () => {
      const mockShahSwapQuote = {
        amountOut: '1000000000000000000',
        priceImpactBps: 30,
        routeLabel: 'ShahSwap',
        hops: 1,
        effectiveSlippageBps: 50
      }

      const mockBalancerQuote = {
        amountOut: '999000000000000000',
        priceImpactBps: 25,
        routeLabel: 'Balancer Weighted',
        hops: 1,
        pool: {
          id: 'pool1',
          address: '0x789',
          poolType: 'Weighted' as const,
          tokens: [],
          totalLiquidity: '1000000',
          swapFee: 0.003,
          lastUpdate: 1234567890
        },
        effectiveSlippageBps: 50
      }

      mockGetBalancerQuote.mockResolvedValue(mockBalancerQuote)

      const bestQuote = await getBestQuote(mockParams)

      expect(bestQuote).toBeDefined()
      expect(bestQuote?.best).toBe('ShahSwap')
      expect(bestQuote?.quote).toEqual(mockShahSwapQuote)
      expect(bestQuote?.alternatives.shahSwap).toBeDefined()
      expect(bestQuote?.alternatives.balancer).toBeDefined()
    })

    it('should return Balancer when it has better output', async () => {
      const mockShahSwapQuote = {
        amountOut: '999000000000000000',
        priceImpactBps: 30,
        routeLabel: 'ShahSwap',
        hops: 1,
        effectiveSlippageBps: 50
      }

      const mockBalancerQuote = {
        amountOut: '1000000000000000000',
        priceImpactBps: 25,
        routeLabel: 'Balancer Weighted',
        hops: 1,
        pool: {
          id: 'pool1',
          address: '0x789',
          poolType: 'Weighted' as const,
          tokens: [],
          totalLiquidity: '1000000',
          swapFee: 0.003,
          lastUpdate: 1234567890
        },
        effectiveSlippageBps: 50
      }

      mockGetBalancerQuote.mockResolvedValue(mockBalancerQuote)

      const bestQuote = await getBestQuote(mockParams)

      expect(bestQuote).toBeDefined()
      expect(bestQuote?.best).toBe('Balancer')
      expect(bestQuote?.quote).toEqual(mockBalancerQuote)
    })

    it('should return ShahSwap when only ShahSwap quote is available', async () => {
      mockGetBalancerQuote.mockResolvedValue(null)

      const bestQuote = await getBestQuote(mockParams)

      expect(bestQuote).toBeDefined()
      expect(bestQuote?.best).toBe('ShahSwap')
      expect(bestQuote?.alternatives.balancer).toBeUndefined()
    })

    it('should return Balancer when only Balancer quote is available', async () => {
      const mockBalancerQuote = {
        amountOut: '1000000000000000000',
        priceImpactBps: 25,
        routeLabel: 'Balancer Weighted',
        hops: 1,
        pool: {
          id: 'pool1',
          address: '0x789',
          poolType: 'Weighted' as const,
          tokens: [],
          totalLiquidity: '1000000',
          swapFee: 0.003,
          lastUpdate: 1234567890
        },
        effectiveSlippageBps: 50
      }

      mockGetBalancerQuote.mockResolvedValue(mockBalancerQuote)

      // Mock ShahSwap to fail
      const bestQuote = await getBestQuote({
        ...mockParams,
        tokenInAddress: 'invalid'
      })

      expect(bestQuote).toBeDefined()
      expect(bestQuote?.best).toBe('Balancer')
      expect(bestQuote?.alternatives.shahSwap).toBeUndefined()
    })

    it('should return null when no quotes are available', async () => {
      mockGetBalancerQuote.mockResolvedValue(null)

      const bestQuote = await getBestQuote({
        ...mockParams,
        tokenInAddress: 'invalid'
      })

      expect(bestQuote).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      mockGetBalancerQuote.mockRejectedValue(new Error('Network error'))

      const bestQuote = await getBestQuote(mockParams)

      expect(bestQuote).toBeDefined()
      expect(bestQuote?.best).toBe('ShahSwap')
    })
  })
}) 