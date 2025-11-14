import axios from 'axios'
import { SHAH_CONTRACTS } from '@/config/shah-constants'

const SHAH_ADDRESS =
  process.env.NEXT_PUBLIC_SHAH ||
  SHAH_CONTRACTS.SHAH

export async function getSHAHPrice(): Promise<number> {
  try {
    const response = await axios.get(
      `https://api.geckoterminal.com/api/v2/networks/eth/tokens/${SHAH_ADDRESS}`
    )
    const price = parseFloat(response.data.data.attributes.price_usd)
    return price
  } catch (error) {
    console.error('Error fetching SHAH price:', error)
    return 0
  }
}
