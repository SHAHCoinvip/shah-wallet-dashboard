import axios from 'axios';

export async function getSHAHPrice(): Promise<number> {
  try {
    const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/eth/tokens/${process.env.SHAH_TOKEN_ADDRESS}`);
    const price = parseFloat(response.data.data.attributes.price_usd);
    return price;
  } catch (error) {
    console.error('Error fetching SHAH price:', error);
    return 0;
  }
}
