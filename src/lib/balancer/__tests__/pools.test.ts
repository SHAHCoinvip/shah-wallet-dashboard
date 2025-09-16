import { fetchPoolsForToken, findPoolsForPair, clearPoolCache } from '../pools'

// Mock fetch
global.fetch = jest.fn()

describe('Balancer Pools', () => {
  beforeEach(() => {
    clearPoolCache()
    jest.clearAllMocks()
  })

  describe('fetchPoolsForToken', () => {
    it('should fetch and cache pools for a token', async () => {
      const mockResponse = {
        data: {
          pools: [
            {
              id: 'pool1',
              address: '0x123',
              poolType: 'Weighted',
              totalLiquidity: '1000000',
              swapFee: 0.003,
              totalWeight: '100',
              amp: null,
              tokens: [
                {
                  address: '0x456',
                  symbol: 'WETH',
                  decimals: 18,
                  weight: 50,
                  balance: '100'
                }
              ],
              lastUpdate: '1234567890'
            }
          ]
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const pools = await fetchPoolsForToken('0x456')

      expect(pools).toHaveLength(1)
      expect(pools[0].id).toBe('pool1')
      expect(pools[0].poolType).toBe('Weighted')
    })

    it('should handle subgraph errors gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const pools = await fetchPoolsForToken('0x456')

      expect(pools).toHaveLength(0)
    })

    it('should return cached results within TTL', async () => {
      const mockResponse = {
        data: { pools: [] }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      // First call
      await fetchPoolsForToken('0x456')
      
      // Second call should use cache
      const pools = await fetchPoolsForToken('0x456')

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(pools).toHaveLength(0)
    })
  })

  describe('findPoolsForPair', () => {
    it('should find common pools for a token pair', async () => {
      const mockResponse1 = {
        data: {
          pools: [
            {
              id: 'pool1',
              address: '0x123',
              poolType: 'Weighted',
              totalLiquidity: '1000000',
              swapFee: 0.003,
              totalWeight: '100',
              amp: null,
              tokens: [
                {
                  address: '0x456',
                  symbol: 'WETH',
                  decimals: 18,
                  weight: 50,
                  balance: '100'
                },
                {
                  address: '0x789',
                  symbol: 'USDC',
                  decimals: 6,
                  weight: 50,
                  balance: '100000'
                }
              ],
              lastUpdate: '1234567890'
            }
          ]
        }
      }

      const mockResponse2 = {
        data: {
          pools: [
            {
              id: 'pool2',
              address: '0x456',
              poolType: 'Stable',
              totalLiquidity: '500000',
              swapFee: 0.001,
              totalWeight: null,
              amp: 100,
              tokens: [
                {
                  address: '0x789',
                  symbol: 'USDC',
                  decimals: 6,
                  weight: null,
                  balance: '50000'
                }
              ],
              lastUpdate: '1234567890'
            }
          ]
        }
      }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2
        })

      const pools = await findPoolsForPair('0x456', '0x789')

      expect(pools).toHaveLength(1)
      expect(pools[0].id).toBe('pool1')
    })
  })
}) 