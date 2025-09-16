export interface EtherscanTransaction {
  blockNumber: string
  timeStamp: string
  hash: string
  nonce: string
  blockHash: string
  transactionIndex: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  isError: string
  txreceipt_status: string
  input: string
  contractAddress: string
  cumulativeGasUsed: string
  gasUsed: string
  confirmations: string
  methodId: string
  functionName: string
}

export interface EtherscanTokenTransfer {
  blockNumber: string
  timeStamp: string
  hash: string
  nonce: string
  blockHash: string
  from: string
  contractAddress: string
  to: string
  value: string
  tokenName: string
  tokenSymbol: string
  tokenDecimal: string
  transactionIndex: string
  gas: string
  gasPrice: string
  gasUsed: string
  cumulativeGasUsed: string
  input: string
  confirmations: string
}

export interface ProcessedTransaction {
  hash: string
  timestamp: number
  from: string
  to: string
  value: string
  type: 'eth' | 'token'
  status: 'success' | 'failed'
  tokenSymbol?: string
  tokenName?: string
  method?: string
  gasUsed: string
}

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_KEY
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api'

/**
 * Fetch normal ETH transactions for an address
 */
export async function getEthTransactions(
  address: string, 
  page: number = 1, 
  offset: number = 10
): Promise<EtherscanTransaction[]> {
  try {
    const url = new URL(ETHERSCAN_BASE_URL)
    url.searchParams.set('module', 'account')
    url.searchParams.set('action', 'txlist')
    url.searchParams.set('address', address)
    url.searchParams.set('startblock', '0')
    url.searchParams.set('endblock', '99999999')
    url.searchParams.set('page', page.toString())
    url.searchParams.set('offset', offset.toString())
    url.searchParams.set('sort', 'desc')
    if (ETHERSCAN_API_KEY) {
      url.searchParams.set('apikey', ETHERSCAN_API_KEY)
    }

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== '1') {
      throw new Error(data.message || 'Failed to fetch transactions')
    }
    
    return data.result || []
  } catch (error) {
    console.error('Error fetching ETH transactions:', error)
    return []
  }
}

/**
 * Fetch ERC-20 token transfers for an address
 */
export async function getTokenTransfers(
  address: string, 
  page: number = 1, 
  offset: number = 10
): Promise<EtherscanTokenTransfer[]> {
  try {
    const url = new URL(ETHERSCAN_BASE_URL)
    url.searchParams.set('module', 'account')
    url.searchParams.set('action', 'tokentx')
    url.searchParams.set('address', address)
    url.searchParams.set('startblock', '0')
    url.searchParams.set('endblock', '99999999')
    url.searchParams.set('page', page.toString())
    url.searchParams.set('offset', offset.toString())
    url.searchParams.set('sort', 'desc')
    if (ETHERSCAN_API_KEY) {
      url.searchParams.set('apikey', ETHERSCAN_API_KEY)
    }

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== '1') {
      // If no token transfers found, return empty array instead of throwing
      if (data.message === 'No transactions found') {
        return []
      }
      throw new Error(data.message || 'Failed to fetch token transfers')
    }
    
    return data.result || []
  } catch (error) {
    console.error('Error fetching token transfers:', error)
    return []
  }
}

/**
 * Get combined and processed transaction history
 */
export async function getTransactionHistory(
  address: string, 
  limit: number = 10
): Promise<ProcessedTransaction[]> {
  try {
    // Fetch both ETH transactions and token transfers in parallel
    const [ethTxs, tokenTxs] = await Promise.all([
      getEthTransactions(address, 1, Math.ceil(limit / 2)),
      getTokenTransfers(address, 1, Math.ceil(limit / 2))
    ])

    // Process ETH transactions
    const processedEthTxs: ProcessedTransaction[] = ethTxs.map(tx => ({
      hash: tx.hash,
      timestamp: parseInt(tx.timeStamp) * 1000,
      from: tx.from,
      to: tx.to,
      value: (parseInt(tx.value) / 1e18).toFixed(6),
      type: 'eth' as const,
      status: tx.txreceipt_status === '1' ? 'success' as const : 'failed' as const,
      method: tx.methodId ? getMethodName(tx.methodId) : undefined,
      gasUsed: tx.gasUsed,
    }))

    // Process token transfers
    const processedTokenTxs: ProcessedTransaction[] = tokenTxs.map(tx => ({
      hash: tx.hash,
      timestamp: parseInt(tx.timeStamp) * 1000,
      from: tx.from,
      to: tx.to,
      value: (parseInt(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal))).toFixed(6),
      type: 'token' as const,
      status: 'success' as const, // Token transfers in results are usually successful
      tokenSymbol: tx.tokenSymbol,
      tokenName: tx.tokenName,
      gasUsed: tx.gasUsed,
    }))

    // Combine and sort by timestamp
    const allTxs = [...processedEthTxs, ...processedTokenTxs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)

    return allTxs
  } catch (error) {
    console.error('Error getting transaction history:', error)
    return []
  }
}

/**
 * Get method name from method ID (basic mapping)
 */
function getMethodName(methodId: string): string {
  const methods: { [key: string]: string } = {
    '0xa9059cbb': 'Transfer',
    '0x095ea7b3': 'Approve',
    '0x23b872dd': 'Transfer From',
    '0x18160ddd': 'Total Supply',
    '0x70a08231': 'Balance Of',
    '0xdd62ed3e': 'Allowance',
    '0x40c10f19': 'Mint',
    '0x42966c68': 'Burn',
    '0x7ff36ab5': 'Swap Exact ETH For Tokens',
    '0x38ed1739': 'Swap Exact Tokens For Tokens',
    '0x8803dbee': 'Swap Tokens For Exact ETH',
    '0xa6886da9': 'Add Liquidity ETH',
    '0xe8e33700': 'Add Liquidity',
    '0x02751cec': 'Remove Liquidity ETH',
    '0xbaa2abde': 'Remove Liquidity',
  }
  
  return methods[methodId] || 'Contract Interaction'
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format timestamp to relative time
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

/**
 * Get Etherscan URL for transaction
 */
export function getEtherscanUrl(hash: string): string {
  return `https://etherscan.io/tx/${hash}`
}