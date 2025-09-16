import { ethers } from 'ethers'
import { TokenInfo } from './tokenList'

const ERC20_ABI = [
  // balanceOf(address)
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  // decimals()
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
]

export async function fetchErc20Balances(
  walletAddress: string,
  tokens: TokenInfo[],
  provider: ethers.JsonRpcProvider
): Promise<{ [symbol: string]: number }> {
  const balances: { [symbol: string]: number } = {}

  for (const token of tokens) {
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, provider)
      const balance = await contract.balanceOf(walletAddress)
      const decimals = token.decimals || 18
      balances[token.symbol] = Number(ethers.formatUnits(balance, decimals))
    } catch (error) {
      console.warn(`⚠️ Failed to fetch balance for ${token.symbol}`, error)
    }
  }

  return balances
}

