import axios from 'axios';

export async function getSHAHPrice(): Promise<number> {
  try {
    // Primary source: GeckoTerminal API
    if (process.env.SHAH_TOKEN_ADDRESS) {
      try {
        const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/eth/tokens/${process.env.SHAH_TOKEN_ADDRESS}`, {
          timeout: 10000
        });
        const price = parseFloat(response.data.data.attributes.price_usd);
        if (price > 0) {
          console.log(`✅ Fetched SHAH price from GeckoTerminal: $${price}`);
          return price;
        }
      } catch (error) {
        console.log('⚠️ GeckoTerminal API failed, trying fallback sources...');
      }
    }

    // Fallback: CoinGecko API (if we have a coin ID)
    if (process.env.SHAH_COINGECKO_ID) {
      try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${process.env.SHAH_COINGECKO_ID}&vs_currencies=usd`, {
          timeout: 10000
        });
        const price = response.data[process.env.SHAH_COINGECKO_ID]?.usd;
        if (price && price > 0) {
          console.log(`✅ Fetched SHAH price from CoinGecko: $${price}`);
          return price;
        }
      } catch (error) {
        console.log('⚠️ CoinGecko API failed...');
      }
    }

    // Final fallback: Return 0 if all sources fail
    console.log('❌ All price sources failed');
    return 0;
  } catch (error) {
    console.error('Error fetching SHAH price:', error);
    return 0;
  }
}

// Helper function to format price with appropriate decimals
export function formatPrice(price: number): string {
  if (price === 0) return '0.00';
  if (price < 0.000001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(8);
  if (price < 1) return price.toFixed(6);
  if (price < 100) return price.toFixed(4);
  return price.toFixed(2);
} 