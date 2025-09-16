const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum'

type TokenPriceResponse = {
  [address: string]: {
    usd: number
  }
}

export async function fetchTokenPrices(
  contractAddresses: string[]
): Promise<Record<string, number>> {
  try {
    const url = `${COINGECKO_URL}?contract_addresses=${contractAddresses.join(',')}&vs_currencies=usd`
    const res = await fetch(url)
    const data: TokenPriceResponse = await res.json()

    const priceMap: Record<string, number> = {}
    for (const [address, info] of Object.entries(data)) {
      priceMap[address.toLowerCase()] = info.usd
    }

    return priceMap
  } catch (error) {
    console.error('Failed to fetch token prices:', error)
    return {}
  }
}
