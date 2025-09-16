import { createPublicClient, http, parseEther, formatEther } from 'viem'
import { mainnet } from 'wagmi/chains'

// Cross-chain bridge configuration
export interface BridgeConfig {
  ethereum: {
    chainId: 1
    rpcUrl: string
    bridgeContract: string
  }
  shahcoin: {
    chainId: 1337 // Replace with actual Shahcoin chain ID
    rpcUrl: string
    bridgeContract: string
  }
}

export interface BridgeTransaction {
  id: string
  fromChain: 'ethereum' | 'shahcoin'
  toChain: 'ethereum' | 'shahcoin'
  amount: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  timestamp: number
  txHash?: string
}

// Bridge ABI for cross-chain transfers
const BRIDGE_ABI = [
  {
    name: 'bridgeTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'destinationChain', type: 'uint256' },
    ],
    outputs: [{ name: 'bridgeId', type: 'bytes32' }],
  },
  {
    name: 'getBridgeStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'bridgeId', type: 'bytes32' }],
    outputs: [
      { name: 'status', type: 'uint8' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
  },
]

export class CrossChainBridge {
  private config: BridgeConfig
  private ethereumClient: any
  private shahcoinClient: any

  constructor(config: BridgeConfig) {
    this.config = config
    this.ethereumClient = createPublicClient({
      chain: mainnet,
      transport: http(config.ethereum.rpcUrl),
    })
    
    // Initialize Shahcoin client (custom chain)
    this.shahcoinClient = createPublicClient({
      chain: {
        id: config.shahcoin.chainId,
        name: 'Shahcoin',
        network: 'shahcoin',
        nativeCurrency: {
          name: 'SHAH',
          symbol: 'SHAH',
          decimals: 18,
        },
        rpcUrls: {
          default: { http: [config.shahcoin.rpcUrl] },
          public: { http: [config.shahcoin.rpcUrl] },
        },
      },
      transport: http(config.shahcoin.rpcUrl),
    })
  }

  async bridgeTokens(
    fromChain: 'ethereum' | 'shahcoin',
    amount: string,
    recipient: string,
    signer: any
  ): Promise<BridgeTransaction> {
    const bridgeId = this.generateBridgeId()
    const amountWei = parseEther(amount)
    
    try {
      const client = fromChain === 'ethereum' ? this.ethereumClient : this.shahcoinClient
      const bridgeContract = fromChain === 'ethereum' 
        ? this.config.ethereum.bridgeContract 
        : this.config.shahcoin.bridgeContract

      // Execute bridge transaction
      const hash = await signer.writeContract({
        address: bridgeContract as `0x${string}`,
        abi: BRIDGE_ABI,
        functionName: 'bridgeTokens',
        args: [
          amountWei,
          recipient as `0x${string}`,
          fromChain === 'ethereum' ? this.config.shahcoin.chainId : this.config.ethereum.chainId,
        ],
      })

      const transaction: BridgeTransaction = {
        id: bridgeId,
        fromChain,
        toChain: fromChain === 'ethereum' ? 'shahcoin' : 'ethereum',
        amount,
        status: 'pending',
        timestamp: Date.now(),
        txHash: hash,
      }

      // Store transaction in local storage for tracking
      this.storeTransaction(transaction)
      
      return transaction
    } catch (error) {
      console.error('Bridge transaction failed:', error)
      throw new Error('Bridge transaction failed')
    }
  }

  async getBridgeStatus(bridgeId: string): Promise<BridgeTransaction | null> {
    try {
      // Check both chains for bridge status
      const [ethereumStatus, shahcoinStatus] = await Promise.all([
        this.checkBridgeStatusOnChain('ethereum', bridgeId),
        this.checkBridgeStatusOnChain('shahcoin', bridgeId),
      ])

      return ethereumStatus || shahcoinStatus
    } catch (error) {
      console.error('Error checking bridge status:', error)
      return null
    }
  }

  private async checkBridgeStatusOnChain(
    chain: 'ethereum' | 'shahcoin',
    bridgeId: string
  ): Promise<BridgeTransaction | null> {
    try {
      const client = chain === 'ethereum' ? this.ethereumClient : this.shahcoinClient
      const bridgeContract = chain === 'ethereum' 
        ? this.config.ethereum.bridgeContract 
        : this.config.shahcoin.bridgeContract

      const [status, amount, recipient] = await client.readContract({
        address: bridgeContract as `0x${string}`,
        abi: BRIDGE_ABI,
        functionName: 'getBridgeStatus',
        args: [bridgeId as `0x${string}`],
      })

      if (status > 0) {
        return {
          id: bridgeId,
          fromChain: chain === 'ethereum' ? 'ethereum' : 'shahcoin',
          toChain: chain === 'ethereum' ? 'shahcoin' : 'ethereum',
          amount: formatEther(amount),
          status: this.mapStatus(status),
          timestamp: Date.now(),
        }
      }

      return null
    } catch (error) {
      console.error(`Error checking ${chain} bridge status:`, error)
      return null
    }
  }

  private mapStatus(status: number): BridgeTransaction['status'] {
    switch (status) {
      case 1: return 'pending'
      case 2: return 'processing'
      case 3: return 'completed'
      case 4: return 'failed'
      default: return 'pending'
    }
  }

  private generateBridgeId(): string {
    return `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private storeTransaction(transaction: BridgeTransaction): void {
    try {
      const stored = localStorage.getItem('bridge_transactions') || '[]'
      const transactions: BridgeTransaction[] = JSON.parse(stored)
      transactions.push(transaction)
      localStorage.setItem('bridge_transactions', JSON.stringify(transactions))
    } catch (error) {
      console.error('Error storing bridge transaction:', error)
    }
  }

  getStoredTransactions(): BridgeTransaction[] {
    try {
      const stored = localStorage.getItem('bridge_transactions') || '[]'
      return JSON.parse(stored)
    } catch (error) {
      console.error('Error retrieving stored transactions:', error)
      return []
    }
  }

  // Get estimated bridge time
  getEstimatedBridgeTime(fromChain: 'ethereum' | 'shahcoin'): number {
    // Ethereum to Shahcoin: ~5 minutes
    // Shahcoin to Ethereum: ~10 minutes
    return fromChain === 'ethereum' ? 5 * 60 * 1000 : 10 * 60 * 1000
  }

  // Get bridge fees
  getBridgeFees(amount: string, fromChain: 'ethereum' | 'shahcoin'): {
    gasFee: string
    bridgeFee: string
    totalFee: string
  } {
    const amountNum = parseFloat(amount)
    const bridgeFee = amountNum * 0.001 // 0.1% bridge fee
    const gasFee = fromChain === 'ethereum' ? 0.005 : 0.001 // ETH gas vs SHAH gas
    const totalFee = bridgeFee + gasFee

    return {
      gasFee: gasFee.toFixed(6),
      bridgeFee: bridgeFee.toFixed(6),
      totalFee: totalFee.toFixed(6),
    }
  }
}

// Default bridge configuration
export const defaultBridgeConfig: BridgeConfig = {
  ethereum: {
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/73f72d4ab51a40c183b3eeeb8103644f',
    bridgeContract: '0x0000000000000000000000000000000000000000', // Replace with actual contract
  },
  shahcoin: {
    chainId: 1337,
    rpcUrl: 'https://rpc.shahcoin.com', // Replace with actual Shahcoin RPC
    bridgeContract: '0x0000000000000000000000000000000000000000', // Replace with actual contract
  },
}

export const bridge = new CrossChainBridge(defaultBridgeConfig) 