export interface PriceData {
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  lastUpdated: number
}

export interface HistoricalPrice {
  timestamp: number
  price: number
}

export interface PriceProvider {
  getPrice(tokenId: string): Promise<PriceData>
  getHistoricalPrices(tokenId: string, days: number): Promise<HistoricalPrice[]>
  getMultiplePrices(tokenIds: string[]): Promise<Record<string, PriceData>>
}

class GeckoTerminalProvider implements PriceProvider {
  private baseUrl = 'https://api.geckoterminal.com/api/v2'
  private apiKey = process.env.GECKOTERMINAL_API_KEY

  async getPrice(tokenId: string): Promise<PriceData> {
    try {
      const response = await fetch(`${this.baseUrl}/simple/networks/ethereum/token_price/${tokenId}`, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      })
      
      if (!response.ok) throw new Error(`GeckoTerminal API error: ${response.status}`)
      
      const data = await response.json()
      const tokenData = data.data.attributes
      
      return {
        price: parseFloat(tokenData.price_usd),
        change24h: parseFloat(tokenData.price_change_percentage_24h),
        volume24h: parseFloat(tokenData.volume_usd_24h),
        marketCap: parseFloat(tokenData.market_cap_usd),
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error('GeckoTerminal price fetch error:', error)
      throw error
    }
  }

  async getHistoricalPrices(tokenId: string, days: number): Promise<HistoricalPrice[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/networks/ethereum/tokens/${tokenId}/price_chart?days=${days}`,
        {
          headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
        }
      )
      
      if (!response.ok) throw new Error(`GeckoTerminal historical API error: ${response.status}`)
      
      const data = await response.json()
      return data.data.map((point: any) => ({
        timestamp: point.attributes.timestamp,
        price: parseFloat(point.attributes.price_usd)
      }))
    } catch (error) {
      console.error('GeckoTerminal historical price fetch error:', error)
      throw error
    }
  }

  async getMultiplePrices(tokenIds: string[]): Promise<Record<string, PriceData>> {
    const prices: Record<string, PriceData> = {}
    
    // GeckoTerminal doesn't support bulk requests, so we'll fetch individually
    await Promise.all(
      tokenIds.map(async (tokenId) => {
        try {
          prices[tokenId] = await this.getPrice(tokenId)
        } catch (error) {
          console.error(`Failed to fetch price for ${tokenId}:`, error)
        }
      })
    )
    
    return prices
  }
}

class CoinGeckoProvider implements PriceProvider {
  private baseUrl = 'https://api.coingecko.com/api/v3'
  private apiKey = process.env.COINGECKO_API_KEY

  async getPrice(tokenId: string): Promise<PriceData> {
    try {
      const url = `${this.baseUrl}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      const response = await fetch(url, {
        headers: this.apiKey ? { 'X-CG-API-KEY': this.apiKey } : {}
      })
      
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`)
      
      const data = await response.json()
      const tokenData = data[tokenId]
      
      return {
        price: tokenData.usd,
        change24h: tokenData.usd_24h_change || 0,
        volume24h: tokenData.usd_24h_vol || 0,
        marketCap: tokenData.usd_market_cap || 0,
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error('CoinGecko price fetch error:', error)
      throw error
    }
  }

  async getHistoricalPrices(tokenId: string, days: number): Promise<HistoricalPrice[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`,
        {
          headers: this.apiKey ? { 'X-CG-API-KEY': this.apiKey } : {}
        }
      )
      
      if (!response.ok) throw new Error(`CoinGecko historical API error: ${response.status}`)
      
      const data = await response.json()
      return data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price
      }))
    } catch (error) {
      console.error('CoinGecko historical price fetch error:', error)
      throw error
    }
  }

  async getMultiplePrices(tokenIds: string[]): Promise<Record<string, PriceData>> {
    try {
      const ids = tokenIds.join(',')
      const url = `${this.baseUrl}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      
      const response = await fetch(url, {
        headers: this.apiKey ? { 'X-CG-API-KEY': this.apiKey } : {}
      })
      
      if (!response.ok) throw new Error(`CoinGecko bulk API error: ${response.status}`)
      
      const data = await response.json()
      const prices: Record<string, PriceData> = {}
      
      Object.entries(data).forEach(([tokenId, tokenData]: [string, any]) => {
        prices[tokenId] = {
          price: tokenData.usd,
          change24h: tokenData.usd_24h_change || 0,
          volume24h: tokenData.usd_24h_vol || 0,
          marketCap: tokenData.usd_market_cap || 0,
          lastUpdated: Date.now()
        }
      })
      
      return prices
    } catch (error) {
      console.error('CoinGecko bulk price fetch error:', error)
      throw error
    }
  }
}

class CryptoCompareProvider implements PriceProvider {
  private baseUrl = 'https://min-api.cryptocompare.com/data'
  private apiKey = process.env.CRYPTOCOMPARE_API_KEY

  async getPrice(tokenId: string): Promise<PriceData> {
    try {
      const response = await fetch(`${this.baseUrl}/price?fsym=${tokenId}&tsyms=USD&api_key=${this.apiKey}`)
      
      if (!response.ok) throw new Error(`CryptoCompare API error: ${response.status}`)
      
      const data = await response.json()
      
      // Get additional data for 24h change, volume, market cap
      const fullDataResponse = await fetch(
        `${this.baseUrl}/pricemultifull?fsyms=${tokenId}&tsyms=USD&api_key=${this.apiKey}`
      )
      
      if (fullDataResponse.ok) {
        const fullData = await fullDataResponse.json()
        const tokenData = fullData.RAW[tokenId]?.USD || {}
        
        return {
          price: data.USD,
          change24h: tokenData.CHANGEPCT24HOUR || 0,
          volume24h: tokenData.VOLUME24HOUR || 0,
          marketCap: tokenData.MKTCAP || 0,
          lastUpdated: Date.now()
        }
      }
      
      return {
        price: data.USD,
        change24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error('CryptoCompare price fetch error:', error)
      throw error
    }
  }

  async getHistoricalPrices(tokenId: string, days: number): Promise<HistoricalPrice[]> {
    try {
      const limit = Math.min(days, 2000) // CryptoCompare limit
      const response = await fetch(
        `${this.baseUrl}/v2/histoday?fsym=${tokenId}&tsym=USD&limit=${limit}&api_key=${this.apiKey}`
      )
      
      if (!response.ok) throw new Error(`CryptoCompare historical API error: ${response.status}`)
      
      const data = await response.json()
      return data.Data.Data.map((point: any) => ({
        timestamp: point.time * 1000,
        price: point.close
      }))
    } catch (error) {
      console.error('CryptoCompare historical price fetch error:', error)
      throw error
    }
  }

  async getMultiplePrices(tokenIds: string[]): Promise<Record<string, PriceData>> {
    try {
      const fsyms = tokenIds.join(',')
      const response = await fetch(
        `${this.baseUrl}/pricemultifull?fsyms=${fsyms}&tsyms=USD&api_key=${this.apiKey}`
      )
      
      if (!response.ok) throw new Error(`CryptoCompare bulk API error: ${response.status}`)
      
      const data = await response.json()
      const prices: Record<string, PriceData> = {}
      
      Object.entries(data.RAW).forEach(([tokenId, tokenData]: [string, any]) => {
        const usdData = (tokenData as any).USD
        prices[tokenId] = {
          price: usdData.PRICE,
          change24h: usdData.CHANGEPCT24HOUR || 0,
          volume24h: usdData.VOLUME24HOUR || 0,
          marketCap: usdData.MKTCAP || 0,
          lastUpdated: Date.now()
        }
      })
      
      return prices
    } catch (error) {
      console.error('CryptoCompare bulk price fetch error:', error)
      throw error
    }
  }
}

// Price cache for performance
class PriceCache {
  private cache = new Map<string, { data: PriceData; timestamp: number }>()
  private readonly TTL = 30000 // 30 seconds

  get(key: string): PriceData | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data
    }
    return null
  }

  set(key: string, data: PriceData): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }
}

// Main price service
export class PriceService {
  private providers: PriceProvider[]
  private currentProvider: PriceProvider
  private cache = new PriceCache()

  constructor() {
    const providerType = process.env.PRICE_PROVIDER || 'geckoterminal'
    
    this.providers = [
      new GeckoTerminalProvider(),
      new CoinGeckoProvider(),
      new CryptoCompareProvider()
    ]
    
    this.currentProvider = this.getProvider(providerType)
  }

  private getProvider(type: string): PriceProvider {
    switch (type.toLowerCase()) {
      case 'geckoterminal':
        return this.providers[0]
      case 'coingecko':
        return this.providers[1]
      case 'cryptocompare':
        return this.providers[2]
      default:
        return this.providers[0] // Default to GeckoTerminal
    }
  }

  async getPrice(tokenId: string): Promise<PriceData> {
    // Check cache first
    const cached = this.cache.get(tokenId)
    if (cached) return cached

    try {
      const price = await this.currentProvider.getPrice(tokenId)
      this.cache.set(tokenId, price)
      return price
    } catch (error) {
      console.error(`Failed to get price for ${tokenId} from primary provider:`, error)
      
      // Try fallback providers
      for (const provider of this.providers) {
        if (provider === this.currentProvider) continue
        
        try {
          const price = await provider.getPrice(tokenId)
          this.cache.set(tokenId, price)
          return price
        } catch (fallbackError) {
          console.error(`Fallback provider failed for ${tokenId}:`, fallbackError)
        }
      }
      
      throw new Error(`All price providers failed for ${tokenId}`)
    }
  }

  async getHistoricalPrices(tokenId: string, days: number): Promise<HistoricalPrice[]> {
    try {
      return await this.currentProvider.getHistoricalPrices(tokenId, days)
    } catch (error) {
      console.error(`Failed to get historical prices for ${tokenId} from primary provider:`, error)
      
      // Try fallback providers
      for (const provider of this.providers) {
        if (provider === this.currentProvider) continue
        
        try {
          return await provider.getHistoricalPrices(tokenId, days)
        } catch (fallbackError) {
          console.error(`Fallback provider failed for historical ${tokenId}:`, fallbackError)
        }
      }
      
      throw new Error(`All historical price providers failed for ${tokenId}`)
    }
  }

  async getMultiplePrices(tokenIds: string[]): Promise<Record<string, PriceData>> {
    try {
      return await this.currentProvider.getMultiplePrices(tokenIds)
    } catch (error) {
      console.error('Failed to get multiple prices from primary provider:', error)
      
      // Try fallback providers
      for (const provider of this.providers) {
        if (provider === this.currentProvider) continue
        
        try {
          return await provider.getMultiplePrices(tokenIds)
        } catch (fallbackError) {
          console.error('Fallback provider failed for multiple prices:', fallbackError)
        }
      }
      
      throw new Error('All price providers failed for multiple prices')
    }
  }

  // Utility methods
  async getUSDValue(tokenId: string, amount: string): Promise<number> {
    const price = await this.getPrice(tokenId)
    return parseFloat(amount) * price.price
  }

  async calculatePnL(tokenId: string, buyPrice: number, currentAmount: string): Promise<{
    pnl: number
    pnlPercentage: number
    currentValue: number
  }> {
    const currentPrice = await this.getPrice(tokenId)
    const currentValue = parseFloat(currentAmount) * currentPrice.price
    const pnl = currentValue - (parseFloat(currentAmount) * buyPrice)
    const pnlPercentage = buyPrice > 0 ? (pnl / (parseFloat(currentAmount) * buyPrice)) * 100 : 0
    
    return { pnl, pnlPercentage, currentValue }
  }
}

// Export singleton instance
export const priceService = new PriceService() 