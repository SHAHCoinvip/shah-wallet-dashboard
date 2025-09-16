import { Chain } from 'wagmi'

export interface NetworkConfig {
  id: number
  name: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: {
    default: { http: string[] }
    public: { http: string[] }
  }
  blockExplorers?: {
    default: { name: string; url: string }
  }
  iconUrl?: string
  isTestnet?: boolean
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://ethereum-rpc.publicnode.com'] },
      public: { http: ['https://ethereum-rpc.publicnode.com'] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://etherscan.io' },
    },
    iconUrl: '/icons/ethereum.svg',
  },
  {
    id: 137,
    name: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://polygon-rpc.com'] },
      public: { http: ['https://polygon-rpc.com'] },
    },
    blockExplorers: {
      default: { name: 'PolygonScan', url: 'https://polygonscan.com' },
    },
    iconUrl: '/icons/polygon.svg',
  },
  {
    id: 56,
    name: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://bsc-dataseed.binance.org'] },
      public: { http: ['https://bsc-dataseed.binance.org'] },
    },
    blockExplorers: {
      default: { name: 'BscScan', url: 'https://bscscan.com' },
    },
    iconUrl: '/icons/bsc.svg',
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://arb1.arbitrum.io/rpc'] },
      public: { http: ['https://arb1.arbitrum.io/rpc'] },
    },
    blockExplorers: {
      default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
    },
    iconUrl: '/icons/arbitrum.svg',
  },
  {
    id: 10,
    name: 'Optimism',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://mainnet.optimism.io'] },
      public: { http: ['https://mainnet.optimism.io'] },
    },
    blockExplorers: {
      default: { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' },
    },
    iconUrl: '/icons/optimism.svg',
  },
]

// Testnet networks
export const TESTNET_NETWORKS: NetworkConfig[] = [
  {
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://rpc.sepolia.org'] },
      public: { http: ['https://rpc.sepolia.org'] },
    },
    blockExplorers: {
      default: { name: 'Sepolia Etherscan', url: 'https://sepolia.etherscan.io' },
    },
    iconUrl: '/icons/ethereum.svg',
    isTestnet: true,
  },
  {
    id: 80001,
    name: 'Mumbai',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://rpc-mumbai.maticvigil.com'] },
      public: { http: ['https://rpc-mumbai.maticvigil.com'] },
    },
    blockExplorers: {
      default: { name: 'Mumbai PolygonScan', url: 'https://mumbai.polygonscan.com' },
    },
    iconUrl: '/icons/polygon.svg',
    isTestnet: true,
  },
]

export const ALL_NETWORKS = [...SUPPORTED_NETWORKS, ...TESTNET_NETWORKS]

// Convert to wagmi Chain format
export const getWagmiChains = (): Chain[] => {
  return ALL_NETWORKS.map((network) => ({
    id: network.id,
    name: network.name,
    nativeCurrency: network.nativeCurrency,
    rpcUrls: network.rpcUrls,
    blockExplorers: network.blockExplorers,
  }))
}

// Network storage utilities
export const NETWORK_STORAGE_KEY = 'shah-wallet-preferred-networks'

export const getStoredNetworks = (): number[] => {
  if (typeof window === 'undefined') return [1] // Default to Ethereum
  try {
    const stored = localStorage.getItem(NETWORK_STORAGE_KEY)
    return stored ? JSON.parse(stored) : [1]
  } catch {
    return [1]
  }
}

export const setStoredNetworks = (networkIds: number[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(NETWORK_STORAGE_KEY, JSON.stringify(networkIds))
  } catch (error) {
    console.error('Failed to store network preferences:', error)
  }
}

export const addStoredNetwork = (networkId: number) => {
  const current = getStoredNetworks()
  if (!current.includes(networkId)) {
    const updated = [...current, networkId]
    setStoredNetworks(updated)
    return updated
  }
  return current
}

export const removeStoredNetwork = (networkId: number) => {
  const current = getStoredNetworks()
  const updated = current.filter(id => id !== networkId)
  if (updated.length === 0) {
    updated.push(1) // Always keep Ethereum
  }
  setStoredNetworks(updated)
  return updated
}

// Get network by ID
export const getNetworkById = (id: number): NetworkConfig | undefined => {
  return ALL_NETWORKS.find(network => network.id === id)
}

// Get network name by ID
export const getNetworkName = (id: number): string => {
  const network = getNetworkById(id)
  return network?.name || 'Unknown Network'
}

// Check if network is supported
export const isNetworkSupported = (id: number): boolean => {
  return ALL_NETWORKS.some(network => network.id === id)
}

// Get default networks (Ethereum + user's stored preferences)
export const getDefaultNetworks = (): number[] => {
  const stored = getStoredNetworks()
  return stored.includes(1) ? stored : [1, ...stored]
} 