import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { getWagmiChains, getDefaultNetworks } from '@/config/networks'

export const wagmiConfig = getDefaultConfig({
  appName: 'SHAH Wallet',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: getWagmiChains(),
  ssr: true,
  // Enable multi-network support
  enableAnalytics: true,
  // Custom RPC configuration
  transports: {
    // You can add custom RPC configurations here if needed
  }
})

// Export default networks for easy access
export const defaultNetworks = getDefaultNetworks() 